import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";
import { pool } from "../db.js";
import { assignUSDTAddress } from "../utils/addressAssignment.js";

export async function depositUSDT(ctx) {
  const telegramId = ctx.from.id;

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
    `Send USDT (TRC20) to your personal address:\n\n` +
    `\`${address}\`\n\n` +
    `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
    `Network: *TRON (TRC20)*\n\n` +
    `This address is unique to you.\n\n` +
    `ℹ Balance updates after payment is completed\n\n` +
    `📋 _Tap the address to copy_`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
    ]),
  });
}
