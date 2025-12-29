// commands/profile.js
import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function profileCommand(ctx) {
  await ctx.answerCbQuery();

  const telegramId = ctx.from.id;

  const res = await pool.query(
    `SELECT balance, created_at
     FROM users
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = res.rows[0];

  if (!user) {
    return ctx.editMessageText("❌ Profile not found.", {
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "main_menu")],
      ]),
    });
  }

  const joined = new Date(user.created_at).toDateString();

  const text =
    `👤 *Your Profile*\n\n` +
    `🆔 *Telegram ID:* ${telegramId}\n` +
    `📅 *Joined:* ${joined}\n\n` +
    `💰 *Balance:* ${user.balance} BTC\n` +
    `🔄 *Transactions:* Coming soon\n\n` +
    `✨ _More features coming_`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📜 Transactions", "profile_transactions")],
      [Markup.button.callback("⬅ Back to Menu", "main_menu")],
    ]),
  });
}
