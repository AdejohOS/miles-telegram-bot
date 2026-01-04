import { pool } from "../db.js";
import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";

export async function depositUSDTTRC20(ctx) {
  const telegramId = ctx.from.id;

  // Check if user already has TRC20 address
  let res = await pool.query(
    `SELECT usdt_trc20_address
     FROM user_addresses
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let address;

  if (res.rows.length && res.rows[0].usdt_trc20_address) {
    address = res.rows[0].usdt_trc20_address;
  } else {
    // Assign from TRC20 pool
    const poolRes = await pool.query(
      `SELECT tron_address
       FROM address_pool_trc20
       WHERE used = false
       LIMIT 1`
    );

    if (!poolRes.rows.length) {
      return ctx.reply(
        "⚠️ No USDT deposit addresses available. Contact support."
      );
    }

    address = poolRes.rows[0].tron_address;

    await pool.query(
      `UPDATE address_pool_trc20
       SET used = true
       WHERE tron_address = $1`,
      [address]
    );

    await pool.query(
      `UPDATE user_addresses
       SET usdt_trc20_address = $1
       WHERE telegram_id = $2`,
      [address, telegramId]
    );
  }

  const text =
    `💰 *USDT Deposit*\n\n` +
    `Send USDT (TRC20 ONLY) to:\n\n` +
    `\`${address}\`\n\n` +
    `This address is unique to you.\n\n` +
    `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
    `⚠️ Do NOT send ERC20/BEP20\n` +
    `ℹ Balance updates after deposit is completed\n\n` +
    `📋 _Tap and hold the address to copy_`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
    ]),
  });
}
