import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminFindUserHandle(ctx) {
  if (ctx.session?.step !== "find_user") return;

  const input = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

  let userRes;
  let foundBy = "";

  // 1️⃣ Telegram ID
  if (/^\d+$/.test(input)) {
    foundBy = "Telegram ID";
    userRes = await pool.query(
      `SELECT telegram_id, username FROM users WHERE telegram_id = $1`,
      [input]
    );
  }

  // 2️⃣ Username
  else if (input.startsWith("@")) {
    foundBy = "Username";
    userRes = await pool.query(
      `SELECT telegram_id, username FROM users WHERE username = $1`,
      [input.replace("@", "")]
    );
  }

  // 3️⃣ BTC address
  else if (input.startsWith("bc1")) {
    foundBy = "BTC Address";
    userRes = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE btc_address = $1`,
      [input]
    );
  }

  // 4️⃣ USDT-TRC20 address
  else if (input.startsWith("T")) {
    foundBy = "USDT-TRC20 Address";
    userRes = await pool.query(
      `SELECT telegram_id FROM user_addresses WHERE usdt_trc20_address = $1`,
      [input]
    );
  } else {
    return ctx.reply("❌ Unsupported input format.");
  }

  if (!userRes || !userRes.rows.length) {
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

  const telegramId = userRes.rows[0].telegram_id;

  // Fetch full user info
  const fullUser = await pool.query(
    `SELECT telegram_id, username, balance FROM users WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = fullUser.rows[0];

  ctx.session = {
    step: "found_user",
    creditUserId: telegramId,
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `✅ *User Found*\n\n` +
      `Found by: ${foundBy}\n` +
      `Telegram ID: \`${user.telegram_id}\`\n` +
      `Username: ${user.username ? "@" + user.username : "N/A"}\n` +
      `Balance: ${user.balance}`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Credit User", "admin_credit_address")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
