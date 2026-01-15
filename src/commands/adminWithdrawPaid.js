import { pool } from "../db.js";

export async function adminWithdrawPaid(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Lock withdrawal row
    const res = await client.query(
      `
      SELECT telegram_id, amount_usd
      FROM withdrawal_requests
      WHERE id = $1
        AND status = 'approved'
      FOR UPDATE
      `,
      [id]
    );

    if (!res.rows.length) {
      throw new Error("Withdrawal not approved or already processed");
    }

    const { telegram_id, amount_usd } = res.rows[0];

    // 💸 Deduct USD permanently
    await client.query(
      `
      UPDATE user_balances
      SET
        balance_usd = balance_usd - $1,
        locked_usd  = locked_usd - $1
      WHERE telegram_id = $2
      `,
      [amount_usd, telegram_id]
    );

    // ✅ Mark withdrawal as PAID
    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'paid',
          processed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    // ✅ Notify admin
    await ctx.editMessageText(`💰 Withdrawal #${id} marked as PAID.`);

    // 🔔 Notify user
    await ctx.telegram.sendMessage(
      telegram_id,
      `💸 <b>Withdrawal Paid</b>\n\n` +
        `Amount: <b>$${amount_usd}</b>\n` +
        `Status: <b>Completed</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin paid failed:", err);
    await ctx.reply("❌ Payment failed: " + err.message);
  } finally {
    client.release();
  }
}
