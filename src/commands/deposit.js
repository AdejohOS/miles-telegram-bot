import { Markup } from "telegraf";

export async function depositCommand(ctx) {
  await ctx.answerCbQuery();

  await ctx.reply(
    "💰 *Choose Deposit Method*",
    Markup.inlineKeyboard([
      [Markup.button.callback("₿ Bitcoin (BTC)", "deposit_btc")],
      [Markup.button.callback("💵 USDT (TRC20)", "deposit_usdt_trc20")],
      [Markup.button.callback("💵 USDT (ERC20)", "deposit_usdt_erc20")],
      [Markup.button.callback("⬅ Back to Menu", "back_to_menu")],
    ])
  );
}
