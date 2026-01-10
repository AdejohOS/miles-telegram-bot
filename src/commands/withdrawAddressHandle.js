import { pool } from "../db.js";

export async function withdrawAddressHandle(ctx) {
  if (ctx.session?.step !== "withdraw_address") return;

  const { currency, amount } = ctx.session;
  const address = ctx.message.text.trim();
  const telegramId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Lock the user's balance row
    const balRes = await client.query(
      `
      SELECT balance, locked
      FROM user_balances
      WHERE telegram_id = $1 AND currency = $2
      FOR UPDATE
      `,
      [telegramId, currency]
    );

    if (!balRes.rows.length) {
      throw new Error("No balance found");
    }

    const balance = Number(balRes.rows[0].balance);
    const locked = Number(balRes.rows[0].locked);
    const available = balance - locked;

    if (amount > available) {
      throw new Error("Insufficient available balance");
    }

    // 🔒 Lock funds
    await client.query(
      `
      UPDATE user_balances
      SET locked = locked + $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegramId, currency]
    );

    // 📝 Create withdrawal request
    await client.query(
      `
      INSERT INTO withdrawal_requests
      (telegram_id, currency, amount, address)
      VALUES ($1, $2, $3, $4)
      `,
      [telegramId, currency, amount, address]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Withdraw failed:", err);
    return ctx.reply("❌ Withdrawal failed: " + err.message);
  } finally {
    client.release();
  }

  ctx.session = null;

  await ctx.reply(
    "✅ Withdrawal request submitted.\n\n" +
      "Your funds are locked pending admin approval."
  );
}
