import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";
import { pool } from "../db.js";
import { assignUSDTAddress } from "../utils/addressAssignment.js";

export async function depositUSDTTRC20(ctx) {
  const telegramId = ctx.from.id;

  try {
    const res = await pool.query(
      `SELECT address
       FROM user_wallets
       WHERE telegram_id = $1 AND currency = 'USDT'`,
      [telegramId],
    );

    let address;

    if (res.rows.length) {
      address = res.rows[0].address;
    } else {
      address = await assignUSDTAddress(telegramId);
    }

    const text =
      `💰 *USDT Deposit (TRC20)*\n\n` +
      `Send USDT to your personal address:\n\n` +
      `\`${address}\`\n\n` +
      `🌐 Network: *TRON (TRC20)*\n` +
      `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n\n` +
      `This address is unique to you.\n\n` +
      `ℹ Balance updates after payment is completed\n\n` +
      `📋 _Tap the address to copy_`;

    if (ctx.callbackQuery?.message) {
      return ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
        ]),
      });
    }

    return ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
      ]),
    });
  } catch (err) {
    const errorText =
      err.message === "NO_USDT_ADDRESS_AVAILABLE_CONTACT_SUPPORT"
        ? "⚠️ *USDT deposits are temporarily unavailable*\n\n" +
          "All deposit addresses are currently in use.\n" +
          "Please try again later."
        : "❌ *An unexpected error occurred*\n\n" + "Please try again later.";

    const options = {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
      ]),
    };

    if (ctx.callbackQuery?.message) {
      return ctx.editMessageText(errorText, options);
    }

    return ctx.reply(errorText, options);
  }
}
