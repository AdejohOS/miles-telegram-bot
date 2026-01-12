import { Markup } from "telegraf";
import { pool } from "../db.js";
import { ADMIN_IDS } from "../config.js";

export async function startCommand(ctx) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || null;
  const isAdmin = ADMIN_IDS.includes(telegramId);

  if (!username) {
    return ctx.reply(
      "⚠️ *Username Required*\n\n" +
        "To use this bot, you must set a Telegram username.\n\n" +
        "📌 How to set it:\n" +
        "• Open Telegram *Settings*\n" +
        "• Tap *Username*\n" +
        "• Create a unique username\n\n" +
        "After setting it, come back and send /start again.",
      { parse_mode: "Markdown" }
    );
  }

  const text =
    "👋 *Hello! Welcome to Miles Trader Bot*\n\nBelow are menus for you to access your profile, deposit, withdrawals, shop, support and escrow services.";

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url("🌐 Group Chat", "https://t.me/milestraderchat")],

    [Markup.button.callback("👤 Profile", "profile")],
    [
      Markup.button.callback("➕ Deposit", "deposit_menu"),
      Markup.button.callback("➖ Withdrawal", "request_withdrawal"),
    ],

    [Markup.button.callback("🛒 Shop", "shop_menu")],
    [Markup.button.callback("🤝 Escrow", "deals")],
    [Markup.button.callback("📜 My Orders", "orders")],
    [Markup.button.callback("📞 Support", "support")],
  ]);
  if (isAdmin) {
    keyboard.reply_markup.inline_keyboard.push([
      Markup.button.callback("🛠 Admin Panel", "admin_menu"),
    ]);
  }
  //  Save / update user in DB

  try {
    await pool.query(
      `
        INSERT INTO users (telegram_id, username)
        VALUES ($1, $2)
        ON CONFLICT (telegram_id)
        DO UPDATE SET username = EXCLUDED.username
      `,
      [telegramId, username]
    );

    await pool.query(
      `
      INSERT INTO user_balances (telegram_id, currency)
      VALUES
        ($1, 'BTC'),
        ($1, 'USDT')
      ON CONFLICT (telegram_id, currency) DO NOTHING
      `,
      [telegramId]
    );
  } catch (err) {
    console.error("DB error in startCommand:", err);
  }

  try {
    // If coming from inline button → EDIT
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
      return await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...keyboard,
      });
    }

    // If coming from /start → REPLY (first message)
    return await ctx.reply(text, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  } catch (err) {
    // Fallback (rare)
    return await ctx.reply(text, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  }
}
