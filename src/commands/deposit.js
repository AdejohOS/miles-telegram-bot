import { Markup } from "telegraf";

export async function depositMenu(ctx) {
  await ctx.editMessageText("💰 *Deposit Menu*\n\nChoose a currency:", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("₿ Bitcoin (BTC)", "deposit_btc")],
      [Markup.button.callback("⬅ Back", "main_menu")],
    ]).reply_markup,
  });
}
