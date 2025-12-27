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
    "👋 Welcome!\n\nUse the menu below to access your wallet, deposit, shop, and escrow services.",
    Markup.keyboard([
      ["🌐 Our Community"],
      ["👛 Wallet", "💰 Deposit"],
      ["💸 Request Withdrawal"],
      ["🤝 Escrow"],
      ["🛒 Shop"],
      ["📜 My Orders"],
      ["🆘 Support"],
    ]).resize()
  );
}
