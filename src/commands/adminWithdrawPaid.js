import { pool } from "../db.js";

export async function adminWithdrawPaid(ctx, id) {
  await pool.query(
    `
    UPDATE withdrawal_requests
    SET status = 'paid', processed_at = NOW()
    WHERE id = $1
    `,
    [id]
  );

  await ctx.editMessageText(`💰 Withdrawal #${id} marked as paid.`);
}
