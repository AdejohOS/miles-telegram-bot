import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminHandleAddress(ctx) {
  if (ctx.session?.step !== "awaiting_address") return;

  const address = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

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
    return ctx.reply("❌ Invalid address format.");
  }

  if (!res.rows.length) {
    return ctx.reply("❌ No user found for this address.");
  }

  ctx.session = {
    step: "awaiting_amount",
    adminMessageId: msgId,
    creditUserId: res.rows[0].telegram_id,
    creditCurrency: currency,
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `✅ *User Found*\n\n` +
      `Telegram ID: \`${res.rows[0].telegram_id}\`\n` +
      `Currency: ${currency}\n\n` +
      `Now enter the *amount* to credit:`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "admin_menu")],
      ]).reply_markup,
    }
  );
}
