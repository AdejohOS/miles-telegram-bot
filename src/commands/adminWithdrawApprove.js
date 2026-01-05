import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawApprove(ctx, withdrawalId) {
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

    await pool.query(
      `
      UPDATE withdrawal_requests
      SET status = 'approved'
      WHERE id = $1
      `,
      [withdrawalId]
    );

    await pool.query("COMMIT");

    await ctx.editMessageText(
      "✅ Withdrawal approved. Mark as PAID after sending funds.",
      {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "💸 Mark as Paid",
              `withdraw_paid_${withdrawalId}`
            ),
          ],
          [Markup.button.callback("⬅ Back", "admin_menu")],
        ]).reply_markup,
      }
    );
  } catch (err) {
    await pool.query("ROLLBACK");
    return ctx.editMessageText("❌ Approval failed.");
  }
}
