// commands/adminWithdrawReject.js
import { pool } from "../db.js";

export async function adminWithdrawReject(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT telegram_id, amount_usd
      FROM withdrawal_requests
      WHERE id = $1 AND status = 'pending'
      FOR UPDATE
      `,
      [id],
    );

    if (!res.rows.length) {
      throw new Error("Withdrawal not found or already processed");
    }

    const { telegram_id, amount_usd } = res.rows[0];

    // 🔓 Unlock funds
    await client.query(
      `
      UPDATE user_balances
      SET locked_usd = locked_usd - $1
      WHERE telegram_id = $2
      `,
      [amount_usd, telegram_id],
    );

    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'rejected'
      WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");

    await ctx.telegram.sendMessage(
      telegram_id,
      `❌ <b>Withdrawal Rejected</b>\n\n💵 Amount: <b>$${amount_usd}</b>\n\nYour funds have been returned to your balance.`,
      { parse_mode: "HTML" },
    );

    await ctx.answerCbQuery("❌ Withdrawal rejected");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    await ctx.answerCbQuery("❌ Rejection failed", { show_alert: true });
  } finally {
    client.release();
  }
}
