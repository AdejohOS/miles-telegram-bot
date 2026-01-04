import { Markup } from "telegraf";

export async function adminCreditFromFoundUser(ctx) {
  if (!ctx.session?.creditUserId) {
    return ctx.answerCbQuery("No user selected.");
  }

  // Move to currency selection step
  ctx.session.step = "choose_currency";
  ctx.session.adminMessageId = ctx.callbackQuery.message.message_id;

  await ctx.editMessageText("➕ *Credit User*\n\nSelect currency to credit:", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback("₿ BTC", "credit_currency_BTC"),
        Markup.button.callback("💵 USDT", "credit_currency_USDT"),
      ],
      [Markup.button.callback("⬅ Cancel", "admin_menu")],
    ]).reply_markup,
  });
}
