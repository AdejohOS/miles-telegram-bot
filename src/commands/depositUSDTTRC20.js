import { pool } from "../db.js";
import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";

export async function depositUSDTTRC20(ctx) {
  const telegramId = ctx.from.id;

  // 1️⃣ Check existing address (same as BTC)
  const res = await pool.query(
    `SELECT usdt_trc20_address
     FROM user_addresses
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let address;

  if (res.rows.length && res.rows[0].usdt_trc20_address) {
    address = res.rows[0].usdt_trc20_address;
  } else {
    // 2️⃣ TRANSACTION (THIS IS THE FIX)
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const poolRes = await client.query(
        `SELECT tron_address
         FROM address_pool_trc20
         WHERE used = false
         LIMIT 1
         FOR UPDATE`
      );

      if (!poolRes.rows.length) {
        throw new Error("No USDT addresses available");
      }

      address = poolRes.rows[0].tron_address;

      await client.query(
        `UPDATE address_pool_trc20
         SET used = true
         WHERE tron_address = $1`,
        [address]
      );

      // ✅ INSERT OR UPDATE (CRITICAL)
      await client.query(
        `INSERT INTO user_addresses (telegram_id, usdt_trc20_address)
         VALUES ($1, $2)
         ON CONFLICT (telegram_id)
         DO UPDATE SET usdt_trc20_address = EXCLUDED.usdt_trc20_address`,
        [telegramId, address]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  const text =
    `💰 *USDT Deposit*\n\n` +
    `Send USDT (TRC20 ONLY) to:\n\n` +
    `\`${address}\`\n\n` +
    `This address is unique to you and does not change.\n\n` +
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
