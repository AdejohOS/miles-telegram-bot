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
      "• Wallet address (BTC / USDT)",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
