import { pool } from "../db.js";

export async function adminWithdrawApprove(ctx, id) {
  await pool.query(
    `
    UPDATE withdrawal_requests
    SET status = 'approved', processed_at = NOW()
    WHERE id = $1 AND status = 'pending'
    `,
    [id]
  );

  await ctx.editMessageText(`✅ Withdrawal #${id} approved.`);
}
