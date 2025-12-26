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
    "Welcome 👋\n\nChoose an option:",
    Markup.keyboard([["💰 Deposit", "📊 Balance"]]).resize()
  );
}
