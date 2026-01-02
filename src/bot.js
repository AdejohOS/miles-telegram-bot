import { pool } from "../db.js";

export async function depositBTC(ctx) {
  const telegramId = ctx.from.id;

  // Check if user already has an address
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
    // Assign from pool
    const poolRes = await pool.query(
      `SELECT btc_address
       FROM address_pool
       WHERE used = false
       LIMIT 1`
    );

    if (!poolRes.rows.length) {
      return ctx.reply("⚠️ No deposit addresses available. Contact support.");
    }

    address = poolRes.rows[0].btc_address;

    await pool.query(
      `UPDATE address_pool SET used = true WHERE btc_address = $1`,
      [address]
    );

    await pool.query(
      `INSERT INTO user_addresses (telegram_id, btc_address)
       VALUES ($1, $2)`,
      [telegramId, address]
    );
  }

  await ctx.editMessageText(
    `₿ *Bitcoin Deposit*\n\n` +
      `Send BTC to your personal address:\n\n` +
      `\`${address}\`\n\n` +
      `This address is unique to you.\n` +
      `Deposits are credited after admin verification.`,
    { parse_mode: "Markdown" }
  );
}
