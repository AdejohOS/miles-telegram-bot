import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminCreditApprove(ctx) {
  if (ctx.session?.step !== "confirm_credit") {
    return ctx.answerCbQuery("No pending credit.");
  }

  const { creditUserId, creditCurrency, creditAmount } = ctx.session;

  // Apply credit
  await pool.query(
    `UPDATE users
     SET balance = balance + $1
     WHERE telegram_id = $2`,
    [creditAmount, creditUserId]
  );

  // Log credit
  await pool.query(
    `INSERT INTO admin_credits (admin_id, telegram_id, currency, amount)
     VALUES ($1, $2, $3, $4)`,
    [ctx.from.id, creditUserId, creditCurrency, creditAmount]
  );

  ctx.session = null;

  await ctx.editMessageText("✅ *Credit approved and applied.*", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
    ]).reply_markup,
  });

  await ctx.telegram.sendMessage(
    creditUserId,
    `🎉 Your ${creditCurrency} deposit has been credited.\nAmount: ${creditAmount}`
  );
}
