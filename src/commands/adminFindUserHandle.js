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

  // 1️⃣ Telegram ID
  if (/^\d+$/.test(input)) {
    foundBy = "Telegram ID";
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE telegram_id = $1`,
      [input]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  // 2️⃣ Username
  else if (input.startsWith("@")) {
    foundBy = "Username";
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [input.slice(1)]
    );
    telegramId = res.rows[0]?.telegram_id;
  }

  // 3️⃣ BTC / USDT address (NEW SCHEMA)
  else if (input.startsWith("bc1") || input.startsWith("T")) {
    foundBy = "Wallet Address";

    const res = await pool.query(
      `
      SELECT telegram_id
      FROM user_wallets
      WHERE address = $1
      `,
      [input]
    );

    telegramId = res.rows[0]?.telegram_id;
  } else {
    return ctx.reply("❌ Invalid search input.");
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

  // 🔍 Fetch user
  const userRes = await pool.query(
    `SELECT telegram_id, username FROM users WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];

  // 🔍 Fetch balances
  const balRes = await pool.query(
    `SELECT currency, balance
     FROM user_balances
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let balanceText = "No balances.";

  if (balRes.rows.length) {
    balanceText = balRes.rows
      .map((b) => `• ${b.currency}: ${formatBalance(b.balance)}`)
      .join("\n");
  }

  // ✅ KEEP SESSION FOR CREDIT
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
      `Telegram ID: \`${user.telegram_id}\`\n` +
      `Username: ${user.username ? "@" + user.username : "N/A"}\n\n` +
      `💰 *Balances*\n${balanceText}`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Credit User", "admin_credit_found_user")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
