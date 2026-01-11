import { pool } from "../db.js";

export async function adminWithdrawReject(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT telegram_id, currency, amount
      FROM withdrawal_requests
      WHERE id = $1 AND status = 'pending'
      FOR UPDATE
      `,
      [id]
    );

    if (!res.rows.length) throw new Error("Invalid");

    const { telegram_id, currency, amount } = res.rows[0];

    // Unlock funds
    await client.query(
      `
      UPDATE user_balances
      SET locked = locked - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegram_id, currency]
    );

    // Mark rejected
    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'rejected', processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    await ctx.editMessageText(`❌ Withdrawal #${id} rejected.`);
  } catch (err) {
    await client.query("ROLLBACK");
    await ctx.editMessageText("❌ Reject failed.");
  } finally {
    client.release();
  }
}
