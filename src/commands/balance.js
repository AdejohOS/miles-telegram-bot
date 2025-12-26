import { pool } from "../db.js";

export async function balanceCommand(ctx) {
  const telegramId = ctx.from.id;

  const res = await pool.query(
    "SELECT balance FROM users WHERE telegram_id = $1",
    [telegramId]
  );

  const balance = res.rows[0]?.balance || 0;
  await ctx.reply(`📊 Your balance:\n${balance} BTC`);
}
