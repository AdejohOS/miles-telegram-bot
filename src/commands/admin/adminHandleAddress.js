import { pool } from "../../db.js";

export async function adminHandleAddress(ctx) {
  if (!ctx.session?.awaitingAddress) return;

  const address = ctx.message.text.trim();
  let res, currency;

  if (address.startsWith("bc1")) {
    currency = "BTC";
    res = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE btc_address = $1`,
      [address]
    );
  } else if (address.startsWith("T")) {
    currency = "USDT";
    res = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE usdt_trc20_address = $1`,
      [address]
    );
  } else {
    return ctx.reply("❌ Unknown address format.");
  }

  if (!res.rows.length) {
    return ctx.reply("❌ No user found for this address.");
  }

  ctx.session = {
    awaitingAmount: true,
    creditUserId: res.rows[0].telegram_id,
    creditCurrency: currency,
  };

  await ctx.reply(
    `✅ *User Found*\n\n` +
      `Telegram ID: \`${res.rows[0].telegram_id}\`\n` +
      `Currency: ${currency}\n\n` +
      `Send the amount to credit:`,
    { parse_mode: "Markdown" }
  );
}
