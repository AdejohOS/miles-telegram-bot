import { Markup } from "telegraf";

export async function depositCommand(ctx) {
  await ctx.answerCbQuery();

  await ctx.editMessageText("💰 *Choose Deposit Method*", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("₿ Bitcoin (BTC)", "deposit_btc")],
      [Markup.button.callback("💵 USDT (TRC20)", "deposit_usdt_trc20")],
      [Markup.button.callback("💵 USDT (ERC20)", "deposit_usdt_erc20")],
      [Markup.button.callback("⬅ Back to Menu", "back_to_menu")],
    ]),
  });
}
