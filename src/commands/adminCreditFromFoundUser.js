import { Markup } from "telegraf";

export async function adminCreditFromFoundUser(ctx) {
  if (!ctx.session?.creditUserId) {
    return ctx.answerCbQuery("No user selected.");
  }

  ctx.session.step = "awaiting_amount";
  ctx.session.adminMessageId = ctx.callbackQuery.message.message_id;

  await ctx.editMessageText("➕ *Credit User*\n\nEnter the amount to credit:", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Cancel", "admin_menu")],
    ]).reply_markup,
  });
}
