import { BTC_ADDRESS } from "../config.js";

export async function depositCommand(ctx) {
  await ctx.reply(
    `💰 *Bitcoin Deposit*\n\n` +
      `Send BTC to:\n\`${BTC_ADDRESS}\`\n\n` +
      `⚠ BTC only\n` +
      `ℹ Balance will be updated after admin confirmation`,
    { parse_mode: "Markdown" }
  );
}
