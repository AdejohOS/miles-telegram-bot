import { Markup } from "telegraf";

export async function requestWithdrawal(ctx) {
  ctx.session = {
    step: "withdraw_choose_currency",
    messageId: ctx.callbackQuery.message.message_id,
  };

  await ctx.editMessageText(
    "💁 *Request Withdrawal*\n\nChoose withdrawal network:",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("₿ BTC", "withdraw_currency_BTC"),
          Markup.button.callback("💵 USDT", "withdraw_currency_USDT"),
        ],
        [Markup.button.callback("⬅ Back", "main_menu")],
      ]).reply_markup,
    }
  );
}
