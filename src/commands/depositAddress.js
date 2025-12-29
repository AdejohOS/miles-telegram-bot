import { Markup } from "telegraf";
import { DEPOSIT_WALLETS, MIN_DEPOSIT_USD } from "../config.js";

export async function depositAddress(ctx, key) {
  await ctx.answerCbQuery();

  const wallet = DEPOSIT_WALLETS[key];

  if (!wallet || !wallet.address) {
    return ctx.reply("❌ Deposit method unavailable. Contact admin.");
  }

  await ctx.reply(
    `💰 *${wallet.name} Deposit*\n\n` +
      `Send funds to:\n\n` +
      `\`${wallet.address}\`\n\n` +
      `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
      `⚠ Send only via the correct network\n` +
      `ℹ Balance updated after admin confirmation\n\n` +
      `📋 _Tap and hold the address to copy_`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "deposit")],
      ]),
    }
  );
}
