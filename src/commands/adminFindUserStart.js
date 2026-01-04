import { Markup } from "telegraf";

export async function adminFindUserStart(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  ctx.session = {
    step: "find_user",
    adminMessageId: ctx.callbackQuery.message.message_id,
  };

  await ctx.editMessageText(
    "🔍 *Find User*\n\n" +
      "Send one of the following:\n\n" +
      "• Telegram ID\n" +
      "• @username\n" +
      "• BTC address (bc1...)\n" +
      "• USDT-TRC20 address (T...)\n",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "admin_menu")],
      ]).reply_markup,
    }
  );
}
