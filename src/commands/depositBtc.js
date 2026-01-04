import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";
import { pool } from "../db.js";
import { assignBTCAddress } from "../utils/addressAssignment.js";

export async function depositBTC(ctx) {
  const telegramId = ctx.from.id;

  let res = await pool.query(
    `SELECT btc_address
     FROM user_addresses
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let address;

  if (res.rows.length) {
    address = res.rows[0].btc_address;
  } else {
    // assign new address (from pool)
    address = await assignBTCAddress(telegramId);
  }

  const text =
    `💰 *BTC Deposit*\n\n` +
    `Send BTC to your personal address:\n\n` +
    `\`${address}\`\n\n` +
    `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
    `This address is unique to you.\n\n` +
    `ℹ Balance updates after payment is completed\n\n` +
    `📋 _Tap and hold the address to copy_`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
    ]),
  });
}
