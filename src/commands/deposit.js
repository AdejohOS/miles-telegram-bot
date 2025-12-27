import { Markup } from "telegraf";
import { BTC_ADDRESS } from "../config.js";

export async function depositCommand(ctx) {
  await ctx.reply(
    `💰 *Bitcoin Deposit*\n\n` +
      `Send BTC to:\n\`${BTC_ADDRESS}\`\n\n` +
      `⚠ *BTC only*\n` +
      `ℹ Balance will be updated after admin confirmation`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.copyText("📋 Copy BTC Address", BTC_ADDRESS)],
        [Markup.button.callback("⬅ Back to Menu", "back_to_menu")],
      ]),
    }
  );
}
