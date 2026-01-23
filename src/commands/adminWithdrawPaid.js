// commands/adminWithdrawPaid.js
import { pool } from "../db.js";

export async function adminWithdrawPaid(ctx, id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT telegram_id, amount_usd
      FROM withdrawal_requests
      WHERE id = $1 AND status = 'approved'
      FOR UPDATE
      `,
      [id],
    );

    if (!res.rows.length) {
      throw new Error("Withdrawal not approved or already paid");
    }

    const { telegram_id, amount_usd } = res.rows[0];

    // 💸 REMOVE FUNDS
    await client.query(
      `
      UPDATE user_balances
      SET
        locked_usd  = locked_usd - $1,
        balance_usd = balance_usd - $1
      WHERE telegram_id = $2
      `,
      [amount_usd, telegram_id],
    );

    // 🧾 TRANSACTION LOG
    await client.query(
      `
      INSERT INTO transactions
        (telegram_id, amount_usd, type, source, reference)
      VALUES ($1, $2, 'debit', 'withdrawal', $3)
      `,
      [telegram_id, amount_usd, `withdrawal:${id}`],
    );

    await client.query(
      `
      UPDATE withdrawal_requests
      SET status = 'paid', paid_at = NOW()
      WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");

    await ctx.telegram.sendMessage(
      telegram_id,
      `💸 <b>Withdrawal Paid</b>\n\n💵 Amount: <b>$${amount_usd}</b>\n\nFunds have been successfully sent.`,
      { parse_mode: "HTML" },
    );

    await ctx.answerCbQuery("💰 Marked as paid");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    await ctx.answerCbQuery("❌ Payment failed", { show_alert: true });
  } finally {
    client.release();
  }
}
