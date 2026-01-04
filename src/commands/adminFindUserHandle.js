import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminFindUserHandle(ctx) {
  if (ctx.session?.step !== "find_user") return;

  const input = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

  let telegramId;
  let foundBy;

  // Telegram ID
  if (/^\d+$/.test(input)) {
    foundBy = "Telegram ID";
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE telegram_id = $1`,
      [input]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  // Username
  else if (input.startsWith("@")) {
    foundBy = "Username";
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [input.slice(1)]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  // BTC
  else if (input.startsWith("bc1")) {
    foundBy = "BTC Address";
    const res = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE btc_address = $1`,
      [input]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  // USDT TRC20
  else if (input.startsWith("T")) {
    foundBy = "USDT-TRC20 Address";
    const res = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE usdt_trc20_address = $1`,
      [input]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  if (!telegramId) {
    return ctx.telegram.editMessageText(
      chatId,
      msgId,
      null,
      "❌ *No user found.*",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back", "admin_menu")],
        ]).reply_markup,
      }
    );
  }

  const user = await pool.query(
    `SELECT telegram_id, username, balance FROM users WHERE telegram_id = $1`,
    [telegramId]
  );

  ctx.session = null;

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `✅ *User Found*\n\n` +
      `Found by: ${foundBy}\n` +
      `Telegram ID: \`${user.rows[0].telegram_id}\`\n` +
      `Username: ${
        user.rows[0].username ? "@" + user.rows[0].username : "N/A"
      }\n` +
      `Balance: ${user.rows[0].balance}`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
      ]).reply_markup,
    }
  );
}
