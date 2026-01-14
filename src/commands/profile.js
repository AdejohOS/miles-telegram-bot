import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function profileCommand(ctx) {
  const telegramId = ctx.from.id;

  const userRes = await pool.query(
    `SELECT created_at, username
     FROM users
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];
  if (!user) return ctx.reply("❌ Profile not found.");

  const balRes = await pool.query(
    `SELECT balance_usd, locked_usd
     FROM user_balances
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const balance = balRes.rows[0]?.balance_usd ?? 0;
  const locked = balRes.rows[0]?.locked_usd ?? 0;
  const available = balance - locked;

  const joined = user.created_at
    ? new Date(user.created_at).toDateString()
    : "N/A";

  const text =
    `👤 <b>Profile</b>\n\n` +
    `Username: @${user.username || "N/A"}\n` +
    `Telegram ID: ${telegramId}\n` +
    `Joined: ${joined}\n\n` +
    `💰 <b>Wallet (USD)</b>\n` +
    `Available: $${available.toFixed(2)}\n` +
    `Locked: $${locked.toFixed(2)}\n` +
    `Total: $${balance.toFixed(2)}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📜 Transactions", "profile_transactions")],
    [Markup.button.callback("⬅ Back to Menu", "main_menu")],
  ]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard.reply_markup,
  });
}
