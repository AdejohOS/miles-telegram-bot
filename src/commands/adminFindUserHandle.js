import { pool } from "../db.js";
import { Markup } from "telegraf";
import { formatBalance } from "../utils/helper.js";

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
    const r = await pool.query(
      `SELECT telegram_id FROM users WHERE telegram_id = $1`,
      [input]
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  // Username
  else if (input.startsWith("@")) {
    foundBy = "Username";
    const r = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [input.slice(1)]
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  // Wallet address
  else {
    foundBy = "Wallet Address";
    const r = await pool.query(
      `SELECT telegram_id FROM user_wallets WHERE address = $1`,
      [input]
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  if (!telegramId) {
    return ctx.telegram.editMessageText(
      chatId,
      msgId,
      null,
      "❌ User not found.",
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back", "admin_menu")],
        ]).reply_markup,
      }
    );
  }

  const user = await pool.query(
    `SELECT telegram_id, username FROM users WHERE telegram_id = $1`,
    [telegramId]
  );

  const bal = await pool.query(
    `SELECT balance_usd, locked_usd FROM user_balances WHERE telegram_id = $1`,
    [telegramId]
  );

  const balance = bal.rows[0]
    ? `$${formatBalance(bal.rows[0].balance_usd)}`
    : "$0.00";

  ctx.session = {
    step: "found_user",
    adminMessageId: msgId,
    creditUserId: telegramId,
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `✅ *User Found*\n\n` +
      `Found by: ${foundBy}\n` +
      `Telegram ID: \`${user.rows[0].telegram_id}\`\n` +
      `Username: ${
        user.rows[0].username ? "@" + user.rows[0].username : "N/A"
      }\n\n` +
      `💰 *Balance:* ${balance}`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Credit User", "admin_credit_found_user")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
