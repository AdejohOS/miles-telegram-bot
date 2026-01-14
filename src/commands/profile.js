import { Markup } from "telegraf";
import { pool } from "../db.js";
import { formatBalance } from "../utils/helper.js";

export async function profileCommand(ctx) {
  const telegramId = ctx.from.id;

  // Always acknowledge callback early (prevents loading spinner)
  await ctx.answerCbQuery?.().catch(() => {});

  try {
    /* ───────────── USER ───────────── */
    const userRes = await pool.query(
      `
      SELECT username, created_at
      FROM users
      WHERE telegram_id = $1
      `,
      [telegramId]
    );

    if (!userRes.rows.length) {
      return ctx.reply("❌ Profile not found.");
    }

    const user = userRes.rows[0];

    /* ───────────── BALANCE ───────────── */
    const balRes = await pool.query(
      `
      SELECT balance, locked
      FROM user_balances
      WHERE telegram_id = $1
      `,
      [telegramId]
    );

    let balanceText = "No balance yet.";

    if (balRes.rows.length) {
      const { balance, locked } = balRes.rows[0];
      balanceText =
        `• Available: $${formatBalance(balance)}\n` +
        `• Locked: $${formatBalance(locked)}`;
    }

    /* ───────────── FORMAT ───────────── */
    const username = user.username ? `@${user.username}` : "N/A";
    const joined = user.created_at
      ? new Date(user.created_at).toDateString()
      : "N/A";

    const text =
      `👤 <b>Profile</b>\n\n` +
      `Username: ${username}\n` +
      `Telegram ID: ${telegramId}\n` +
      `Joined: ${joined}\n\n` +
      `💰 <b>Balance (USD)</b>\n${balanceText}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("📜 Transactions", "profile_transactions")],
      [Markup.button.callback("⬅ Back to Menu", "main_menu")],
    ]);

    const payload = {
      parse_mode: "HTML",
      reply_markup: keyboard.reply_markup,
    };

    /* ───────────── SEND / EDIT ───────────── */
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, payload);
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
