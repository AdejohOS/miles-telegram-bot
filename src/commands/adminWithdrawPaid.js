import { pool } from "../db.js";

export async function adminWithdrawPaid(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT telegram_id, amount
      FROM withdrawal_requests
      WHERE id = $1 AND status = 'approved'
      FOR UPDATE
      `,
      [id]
    );

    if (!res.rows.length) throw new Error("Withdrawal not approved");

    const { telegram_id, amount } = res.rows[0];

    // 💸 Deduct USD permanently
    await client.query(
      `
      UPDATE user_balances
      SET
        balance_usd = balance_usd - $1,
        locked_usd = locked_usd - $1
      WHERE telegram_id = $2
      `,
      [amount, telegram_id]
    );

    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'paid', processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    await ctx.editMessageText(`💰 Withdrawal #${id} marked as PAID.`);
  } catch (err) {
    await client.query("ROLLBACK");
    ctx.reply("❌ Payment failed: " + err.message);
  } finally {
    client.release();
  }
}
