import { pool } from "../db.js";

export async function dealReceiver(ctx) {
  if (ctx.session?.step !== "deal_receiver") return;

  const input = ctx.message.text.trim();

  const res = input.startsWith("@")
    ? await pool.query(`SELECT telegram_id FROM users WHERE username = $1`, [
        input.slice(1),
      ])
    : await pool.query(`SELECT telegram_id FROM users WHERE telegram_id = $1`, [
        input,
      ]);

  if (!res.rows.length) {
    return ctx.reply("❌ User not found.");
  }

  ctx.session.receiverId = res.rows[0].telegram_id;
  ctx.session.step = "deal_amount";

  await ctx.reply("💵 Enter deal amount in USD:");
}

export async function dealAmount(ctx) {
  if (ctx.session?.step !== "deal_amount") return;

  const amount = Number(ctx.message.text);
  if (!amount || amount <= 0) {
    return ctx.reply("❌ Invalid amount.");
  }

  ctx.session.amountUsd = amount;
  ctx.session.step = "deal_desc";

  await ctx.reply("📝 Describe the deal:");
}

export async function dealDesc(ctx) {
  if (ctx.session?.step !== "deal_desc") return;

  const description = ctx.message.text;
  const { receiverId, amountUsd } = ctx.session;
  const senderId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const balRes = await client.query(
      `
      SELECT balance_usd, locked_usd
      FROM user_balances
      WHERE telegram_id = $1
      FOR UPDATE
      `,
      [senderId]
    );

    if (!balRes.rows.length) {
      throw new Error("No balance found");
    }

    const available =
      Number(balRes.rows[0].balance_usd) - Number(balRes.rows[0].locked_usd);

    if (amountUsd > available) {
      throw new Error("Insufficient available balance");
    }

    // 🔒 Lock funds
    await client.query(
      `
      UPDATE user_balances
      SET locked_usd = locked_usd + $1
      WHERE telegram_id = $2
      `,
      [amountUsd, senderId]
    );

    const dealRes = await client.query(
      `
      INSERT INTO deals (sender_id, receiver_id, amount_usd, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [senderId, receiverId, amountUsd, description]
    );

    await client.query("COMMIT");

    ctx.session = null;

    await ctx.reply(
      `🤝 Deal #${dealRes.rows[0].id} created.\n\nAmount: $${amountUsd}\nStatus: Awaiting acceptance.`
    );

    await ctx.telegram.sendMessage(
      receiverId,
      `📨 <b>New Deal Request</b>\n\nAmount: <b>$${amountUsd}</b>\n${description}\n\nGo to Deals to accept.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    await ctx.reply("❌ " + err.message);
  } finally {
    client.release();
  }
}
