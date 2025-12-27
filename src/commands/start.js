import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function startCommand(ctx) {
  const telegramId = ctx.from.id;

  await pool.query(
    `INSERT INTO users (telegram_id)
     VALUES ($1)
     ON CONFLICT (telegram_id) DO NOTHING`,
    [telegramId]
  );

  await ctx.reply(
    "👋 *Welcome!*\n\nUse the menu below to access your wallet, deposit, shop, and escrow services.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.url(
            "🌐 Our Community",
            "https://t.me/yourcommunitylink"
          ),
        ],

        [
          Markup.button.callback("💰 Deposit", "deposit"),
          Markup.button.callback("📊 Wallet", "balance"),
        ],
        [Markup.button.callback("🛒 Shop", "shop")],
        [Markup.button.callback("⚖ Escrow", "escrow")],
        [Markup.button.callback("📜 My Orders", "orders")],
        [Markup.button.callback("📞 Support", "support")],
      ]),
    }
  );
}
