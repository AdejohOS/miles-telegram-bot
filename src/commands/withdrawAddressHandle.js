import { pool } from "../db.js";

export async function withdrawAddressHandle(ctx) {
  if (ctx.session?.step !== "withdraw_address") return;

  const { currency, amount } = ctx.session;
  const address = ctx.message.text.trim();
  const telegramId = ctx.from.id;

  try {
    await pool.query("BEGIN");

    // Check available balance
    const balRes = await pool.query(
      `
      SELECT balance, locked
      FROM user_balances
      WHERE telegram_id = $1 AND currency = $2
      FOR UPDATE
      `,
      [telegramId, currency]
    );

    if (!balRes.rows.length) throw new Error("No balance");

    const available =
      Number(balRes.rows[0].balance) - Number(balRes.rows[0].locked);

    if (amount > available) {
      throw new Error("Insufficient balance");
    }

    // Lock funds
    await pool.query(
      `
      UPDATE user_balances
      SET locked = locked + $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegramId, currency]
    );

    // Create request
    await pool.query(
      `
      INSERT INTO withdrawal_requests
      (telegram_id, currency, amount, address)
      VALUES ($1, $2, $3, $4)
      `,
      [telegramId, currency, amount, address]
    );

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    return ctx.reply("❌ Withdrawal failed: " + err.message);
  }

  ctx.session = null;

  await ctx.reply(
    "✅ Withdrawal request submitted.\n\n" +
      "Your funds are locked pending admin approval."
  );
}
