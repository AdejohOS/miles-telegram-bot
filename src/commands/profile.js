import { Markup } from "telegraf";
import { pool } from "../db.js";
import { formatBalance } from "../utils/helper.js";

export async function profileCommand(ctx) {
  console.log(
    "PROFILE handler called",
    ctx.update.callback_query?.id || "no callback"
  );

  try {
    const telegramId = ctx.from.id;

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
      `👤 *Profile*\n\n` +
      `Username: ${username}\n` +
      `Telegram ID: ${telegramId}\n` +
      `Joined: ${joined}\n\n` +
      `💰 *Balances:*\n${balanceText}\n`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("📜 Transactions", "profile_transactions")],
        [Markup.button.callback("⬅ Back to Menu", "main_menu")],
      ]).reply_markup,
    });

    // Now safely acknowledge callback
    await ctx.answerCbQuery?.().catch(() => {});
  } catch (error) {
    console.error("PROFILE handler crashed:", error);
    await ctx.reply("❌ Profile failed. Check logs.");
  }
}
