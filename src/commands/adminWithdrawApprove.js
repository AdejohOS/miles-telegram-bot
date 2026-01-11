import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawApprove(ctx, id) {
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

    if (!res.rows.length) {
      throw new Error("Not found or already processed");
    }

    const { telegram_id, currency, amount } = res.rows[0];

    // Deduct locked balance
    await client.query(
      `
      UPDATE user_balances
      SET locked = locked - $1,
          balance = balance - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegram_id, currency]
    );

    // Mark approved
    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'approved', processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");
    await ctx.editMessageText(`✅ Withdrawal #${id} approved.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    await ctx.editMessageText("❌ Approval failed.");
  } finally {
    client.release();
  }
}
