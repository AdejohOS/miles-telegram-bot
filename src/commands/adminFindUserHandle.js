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
    const r = await pool.query(
      `SELECT telegram_id FROM users WHERE telegram_id = $1`,
      [input]
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  // 2️⃣ Username
  else if (input.startsWith("@")) {
    foundBy = "Username";
    const r = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [input.slice(1)]
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  // 3️⃣ Wallet Address
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

  // Fetch user
  const userRes = await pool.query(
    `SELECT telegram_id, username FROM users WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];

  // Fetch balance
  const balRes = await pool.query(
    `SELECT balance_usd FROM user_balances WHERE telegram_id = $1`,
    [telegramId]
  );

  const balanceUsd = balRes.rows.length
    ? `$${formatBalance(balRes.rows[0].balance_usd)}`
    : "$0.00";

  // Keep session for next step
  ctx.session = {
    step: "found_user",
    adminMessageId: msgId,
    creditUserId: telegramId,
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `
<b>✅ User Found</b>

<b>Found by:</b> ${foundBy}
<b>Telegram ID:</b> ${user.telegram_id}
<b>Username:</b> ${user.username ? "@" + user.username : "N/A"}

<b>💰 Balance:</b> ${balanceUsd}
    `,
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Credit User", "admin_credit_found_user")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
