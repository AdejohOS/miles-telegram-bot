import { pool } from "../db.js";

export async function addBalance(ctx) {
  const [, userId, amount] = ctx.message.text.split(" ");
  if (!userId || !amount) return ctx.reply("Usage: /addbalance <id> <amount>");

  await pool.query(
    "UPDATE users SET balance = balance + $1 WHERE telegram_id = $2",
    [amount, userId]
  );

  await pool.query(
    `INSERT INTO balance_logs (admin_id, user_id, amount, action)
     VALUES ($1, $2, $3, 'add')`,
    [ctx.from.id, userId, amount]
  );

  ctx.reply(`✅ Added ${amount} BTC to user ${userId}`);
}

export async function deductBalance(ctx) {
  const [, userId, amount] = ctx.message.text.split(" ");
  if (!userId || !amount)
    return ctx.reply("Usage: /deductbalance <id> <amount>");

  await pool.query(
    "UPDATE users SET balance = balance - $1 WHERE telegram_id = $2",
    [amount, userId]
  );

  await pool.query(
    `INSERT INTO balance_logs (admin_id, user_id, amount, action)
     VALUES ($1, $2, $3, 'deduct')`,
    [ctx.from.id, userId, amount]
  );

  ctx.reply(`✅ Deducted ${amount} BTC from user ${userId}`);
}
