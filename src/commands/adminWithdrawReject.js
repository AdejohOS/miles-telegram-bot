import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawReject(ctx, withdrawalId) {
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

    if (!res.rows.length || res.rows[0].status !== "pending") {
      throw new Error("Invalid withdrawal");
    }

    const { telegram_id, currency, amount } = res.rows[0];

    await pool.query(
      `
      UPDATE user_balances
      SET locked = locked - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amount, telegram_id, currency]
    );

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'rejected', processed_at = NOW()
      WHERE id = $1
      `,
      [withdrawalId]
    );

    await pool.query("COMMIT");

    await ctx.telegram.sendMessage(
      telegram_id,
      `❌ Your ${currency} withdrawal of ${amount} was rejected.`
    );

    await ctx.editMessageText("❌ Withdrawal rejected.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    return ctx.editMessageText("❌ Rejection failed.");
  }
}
