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
    if (err.message === "NO_USDT_ADDRESS_AVAILABLE_CONTACT_SUPPORT") {
      return ctx.reply(
        "⚠️ USDT deposits are temporarily unavailable. Please contact support.",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
          ]),
        },
      );
    }

    console.error("depositUSDTTRC20 error:", err);
    return ctx.reply(
      "❌ An unexpected error occurred. Please try again later.",
    );
  }
}
