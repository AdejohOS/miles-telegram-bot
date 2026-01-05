import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawPaid(ctx, withdrawalId) {
  try {
    await pool.query("BEGIN");

    const res = await pool.query(
      `
      SELECT telegram_id, currency, amount, status
      FROM withdrawal_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [withdrawalId]
    );

    if (!res.rows.length || res.rows[0].status !== "approved") {
      throw new Error("Invalid state");
    }

    const { telegram_id, currency, amount } = res.rows[0];

    // Deduct balance & unlock
    await pool.query(
      `
      UPDATE user_balances
      SET balance = balance - $1,
          locked = locked - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegram_id, currency]
    );

    // Ledger
    await pool.query(
      `
      INSERT INTO transactions
      (telegram_id, currency, amount, type, source, reference)
      VALUES ($1, $2, $3, 'debit', 'withdrawal', 'paid')
      `,
      [telegram_id, currency, amount]
    );

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'paid', processed_at = NOW()
      WHERE id = $1
      `,
      [withdrawalId]
    );

    await pool.query("COMMIT");

    await ctx.telegram.sendMessage(
      telegram_id,
      `✅ Your ${currency} withdrawal of ${amount} has been paid.`
    );

    await ctx.editMessageText("💸 Withdrawal marked as PAID.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    return ctx.editMessageText("❌ Payment failed.");
  }
}
