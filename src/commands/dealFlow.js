import { pool } from "../db.js";
import { Markup } from "telegraf";

/* STEP 1 — RECEIVER */
export async function dealReceiver(ctx) {
  const input = ctx.message.text.trim();

  const res = input.startsWith("@")
    ? await pool.query(`SELECT telegram_id FROM users WHERE username=$1`, [
        input.slice(1),
      ])
    : await pool.query(`SELECT telegram_id FROM users WHERE telegram_id=$1`, [
        input,
      ]);

  if (!res.rows.length) {
    return ctx.reply("❌ User not found.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "deals")],
      ]).reply_markup,
    });
  }

  ctx.session.receiverId = Number(res.rows[0].telegram_id);
  ctx.session.step = "deal_amount";

  await ctx.reply("💵 Enter deal amount (USD):");
}

/* STEP 2 — AMOUNT */
export async function dealAmount(ctx) {
  const amount = Number(ctx.message.text);
  if (!amount || amount <= 0) return ctx.reply("❌ Invalid amount.");

  ctx.session.amount_usd = amount;
  ctx.session.step = "deal_desc";

  await ctx.reply("📝 Describe the deal:");
}

/* STEP 3 — DESCRIPTION + CREATE */
export async function dealDesc(ctx) {
  const description = ctx.message.text;
  const senderId = Number(ctx.from.id);
  const { receiverId, amount_usd } = ctx.session;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bal = await client.query(
      `SELECT balance_usd, locked_usd
       FROM user_balances
       WHERE telegram_id=$1
       FOR UPDATE`,
      [senderId],
    );

    if (!bal.rows.length) throw new Error("No balance found");

    const available = bal.rows[0].balance_usd - bal.rows[0].locked_usd;
    if (amount_usd > available) throw new Error("Insufficient balance");

    await client.query(
      `UPDATE user_balances
       SET locked_usd = locked_usd + $1
       WHERE telegram_id = $2`,
      [amount_usd, senderId],
    );

    const deal = await client.query(
      `INSERT INTO deals (sender_id, receiver_id, amount_usd, description)
       VALUES ($1,$2,$3,$4)
       RETURNING id, created_at`,
      [senderId, receiverId, amount_usd, description],
    );

    const { id, created_at } = deal.rows[0];
    const createdAt = new Date(created_at).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await client.query("COMMIT");
    ctx.session = null;

    await ctx.reply(
      `🤝 Deal #${deal.rows[0].id} created and awaiting acceptance.`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Deals", "deals")],
        ]).reply_markup,
      },
    );

    await ctx.telegram.sendMessage(
      receiverId,
      `📨 <b>New Deal Request</b>\n\n` +
        `💵 <b>$${amount_usd}</b>\n` +
        `📝 ${description}\n` +
        `⏲️ ${createdAt}\n\n` +
        `Do you want to accept this deal?`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "✅ Accept Deal",
              `deal_accept_${deal.rows[0].id}`,
            ),
            Markup.button.callback(
              "❌ Reject Deal",
              `deal_reject_${deal.rows[0].id}`,
            ),
          ],
          [Markup.button.callback("📦 View All Deals", "deals")],
        ]).reply_markup,
      },
    );
  } catch (e) {
    await client.query("ROLLBACK");
    ctx.reply("❌ " + e.message);
  } finally {
    client.release();
  }
}
