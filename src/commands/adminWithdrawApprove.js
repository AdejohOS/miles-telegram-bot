// commands/adminWithdrawApprove.js
import { pool } from "../db.js";

export async function adminWithdrawApprove(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'approved'
      WHERE id = $1 AND status = 'pending'
      RETURNING telegram_id, amount_usd
      `,
      [id],
    );

    if (!res.rows.length) {
      throw new Error("Withdrawal not found or already processed");
    }

    const { telegram_id, amount_usd } = res.rows[0];

    await client.query("COMMIT");

    await ctx.telegram.sendMessage(
      telegram_id,
      `✅ <b>Withdrawal Approved</b>\n\n💵 Amount: <b>$${amount_usd}</b>\n\nYour withdrawal has been approved and will be paid shortly.`,
      { parse_mode: "HTML" },
    );

    await ctx.answerCbQuery("✅ Withdrawal approved");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    await ctx.answerCbQuery("❌ Approval failed", { show_alert: true });
  } finally {
    client.release();
  }
}
