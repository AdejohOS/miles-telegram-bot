import { Markup } from "telegraf";
import { pool } from "../db.js";
import { formatBalance } from "../utils/helper.js";

export async function profileCommand(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const telegramId = ctx.from.id;

  const userRes = await pool.query(
    `SELECT created_at, username
     FROM users
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];

  const send = async (text, keyboard) => {
    if (ctx.callbackQuery?.message) {
      return ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...keyboard,
      });
    }
    return ctx.reply(text, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  };

  if (!user) {
    return send(
      "❌ Profile not found.",
      Markup.inlineKeyboard([[Markup.button.callback("⬅ Back", "main_menu")]])
    );
  }

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

  const joined = new Date(user.created_at).toDateString();
  const username = user.username ? `@${user.username}` : "N/A";

  const text =
    `👤 *Profile*\n\n` +
    `Username: ${username}\n` +
    `Telegram ID: ${telegramId}\n` +
    `Joined: ${joined}\n\n` +
    `💰 *Balances:*\n${balanceText}\n`;

  return send(
    text,
    Markup.inlineKeyboard([
      [Markup.button.callback("📜 Transactions", "profile_transactions")],
      [Markup.button.callback("⬅ Back to Menu", "main_menu")],
    ])
  );
}
