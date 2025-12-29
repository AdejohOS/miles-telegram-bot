import { Markup } from "telegraf";

export async function depositCommand(ctx) {
  await ctx.answerCbQuery();

  const text = "💰 *Choose Deposit Method*";
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("₿ Bitcoin (BTC)", "deposit_btc")],
    [Markup.button.callback("💵 USDT (TRC20)", "deposit_usdt_trc20")],
    [Markup.button.callback("💵 USDT (ERC20)", "deposit_usdt_erc20")],
    [Markup.button.callback("⬅ Back to Menu", "main_menu")],
  ]);

  try {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  } catch (err) {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  }
}
