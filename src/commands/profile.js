import { Markup } from "telegraf";
import { pool } from "../db.js";
import { formatBalance } from "../utils/helper.js";

export async function profileCommand(ctx) {
  const telegramId = ctx.from.id;

  // Fetch user
  const userRes = await pool.query(
    `SELECT created_at, username
     FROM users
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];

  if (!user) {
    return ctx.reply("❌ Profile not found.");
  }

  // Fetch balances
  const balRes = await pool.query(
    `SELECT currency, balance
     FROM user_balances
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let balanceText = "No balances yet.";

  if (balRes.rows.length) {
    balanceText = balRes.rows
      .map((b) => `• ${b.currency}: ${formatBalance(b.balance)}`)
      .join("\n");
  }

  const joined = user.created_at
    ? new Date(user.created_at).toDateString()
    : "N/A";

  const username = user.username ? `@${user.username}` : "N/A";

  const text =
    `👤 <b>Profile</b>\n\n` +
    `Username: ${username}\n` +
    `Telegram ID: ${telegramId}\n` +
    `Joined: ${joined}\n\n` +
    `💰 <b>Balances:</b>\n${balanceText}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📜 Transactions", "profile_transactions")],
    [Markup.button.callback("⬅ Back to Menu", "main_menu")],
  ]);

  const payload = {
    parse_mode: "HTML",
    reply_markup: keyboard.reply_markup,
  };

  try {
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, payload);
        await ctx.answerCbQuery().catch(() => {});
      } catch {
        await ctx.reply(text, payload);
      }
    } else {
      await ctx.reply(text, payload);
    }
  } catch (err) {
    console.error("Profile display failed:", err);
    await ctx.reply("❌ Failed to load profile.");
  }
}
