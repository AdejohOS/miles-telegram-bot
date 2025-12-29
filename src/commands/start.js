// Working start command
import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function startCommand(ctx) {
  const telegramId = ctx.from.id;

  try {
    await pool.query(
      `INSERT INTO users (telegram_id)
       VALUES ($1)
       ON CONFLICT (telegram_id) DO NOTHING`,
      [telegramId]
    );
  } catch (err) {
    console.error("DB error in startCommand:", err);
  }

  await ctx.reply(
    "👋 *Welcome!*\n\nUse the menu below to access your wallet, deposit, shop, and escrow services.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url("🌐 Our Community", "https://t.me/milestraderchat")],

        [
          Markup.button.callback("💰 Deposit", "deposit"),
          Markup.button.callback("📊 Wallet", "balance"),
        ],
        [Markup.button.callback("💁 Request Withdrawal", "requestWithdrawal")],
        [Markup.button.callback("🛒 Shop", "shop")],
        [Markup.button.callback("🤝 Escrow", "escrow")],
        [Markup.button.callback("📜 My Orders", "orders")],
        [Markup.button.callback("📞 Support", "support")],
      ]),
    }
  );
}
