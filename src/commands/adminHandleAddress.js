import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminHandleAddress(ctx) {
  if (ctx.session?.step !== "awaiting_address") return;

  const address = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

  let currency;

  if (address.startsWith("bc1")) currency = "BTC";
  else if (address.startsWith("T")) currency = "USDT";
  else return ctx.reply("❌ Invalid address format.");

  const res = await pool.query(
    `
    SELECT u.telegram_id, u.username
    FROM user_wallets w
    JOIN users u ON u.telegram_id = w.telegram_id
    WHERE w.address = $1 AND w.currency = $2
    `,
    [address, currency]
  );

  if (!res.rows.length) {
    return ctx.reply("❌ No user found for this address.");
  }

  const user = res.rows[0];

  ctx.session = {
    step: "awaiting_amount",
    adminMessageId: msgId,
    creditUserId: user.telegram_id,
    creditCurrency: currency,
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `✅ *User Found*\n\n` +
      `Telegram ID: \`${user.telegram_id}\`\n` +
      `Currency: ${currency}\n` +
      `Username: ${user.username ? "@" + user.username : "N/A"}\n\n` +
      `Now enter the *amount* to credit:`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "admin_menu")],
      ]).reply_markup,
    }
  );
}
