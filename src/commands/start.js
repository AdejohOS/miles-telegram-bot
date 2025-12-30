import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function startCommand(ctx) {
  const isAdmin = ctx.from?.id === Number(process.env.ADMIN_ID);
  const text =
    "👋 *Welcome!*\n\nUse the menu below to access your wallet, deposit, shop, and escrow services.";

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url("🌐 Group Chat", "https://t.me/milestraderchat")],
    [
      Markup.button.callback("💰 Deposit", "deposit_menu"),
      Markup.button.callback("👤 Profile", "profile"),
    ],
    [Markup.button.callback("💁 Request Withdrawal", "requestWithdrawal")],
    [Markup.button.callback("🛒 Shop", "shop")],
    [Markup.button.callback("🤝 Escrow", "escrow")],
    [Markup.button.callback("📜 My Orders", "orders")],
    [Markup.button.callback("📞 Support", "support")],
  ]);
  if (isAdmin) {
    keyboard.reply_markup.inline_keyboard.push([
      Markup.button.callback("🛠 Admin Panel", "admin_panel"),
    ]);
  }
  // DB insert ONLY on real /start
  if (ctx.message?.from) {
    try {
      await pool.query(
        `INSERT INTO users (telegram_id)
         VALUES ($1)
         ON CONFLICT (telegram_id) DO NOTHING`,
        [ctx.from.id]
      );
    } catch (err) {
      console.error("DB error in startCommand:", err);
    }
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
