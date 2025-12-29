import { Markup } from "telegraf";
import { DEPOSIT_WALLETS, MIN_DEPOSIT_USD } from "../config.js";

export async function depositAddress(ctx, key) {
  await ctx.answerCbQuery();

  const wallet = DEPOSIT_WALLETS[key];

  // Never reply in single-message flow
  if (!wallet || !wallet.address) {
    return ctx.editMessageText(
      "❌ Deposit method unavailable. Contact admin.",
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back", "deposit_menu")],
        ]),
      }
    );
  }

  const text =
    `💰 *${wallet.name} Deposit*\n\n` +
    `Send funds to:\n\n` +
    `\`${wallet.address}\`\n\n` +
    `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
    `⚠ Send only via the correct network\n` +
    `ℹ Balance updated after admin confirmation\n\n` +
    `📋 _Tap and hold the address to copy_`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "deposit_menu")],
    ]),
  });
}
