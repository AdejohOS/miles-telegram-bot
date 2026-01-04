import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminHandleAmount(ctx) {
  if (ctx.session?.step !== "awaiting_amount") return;

  const amount = Number(ctx.message.text.trim());
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Invalid amount.");
  }

  const { creditUserId, creditCurrency } = ctx.session;

  await pool.query(
    `UPDATE users SET balance = balance + $1 WHERE telegram_id = $2`,
    [amount, creditUserId]
  );

  await pool.query(
    `INSERT INTO admin_credits (admin_id, telegram_id, currency, amount)
     VALUES ($1, $2, $3, $4)`,
    [ctx.from.id, creditUserId, creditCurrency, amount]
  );

  ctx.session = null;

  await ctx.reply("✅ *Credit applied successfully.*", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
    ]).reply_markup,
  });

  await ctx.telegram.sendMessage(
    creditUserId,
    `🎉 Your ${creditCurrency} deposit has been credited.\nAmount: ${amount}`
  );
}
