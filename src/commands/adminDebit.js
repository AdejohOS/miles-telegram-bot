import { pool } from "../db.js";

export async function adminDebit(ctx) {
  const [_, telegramId, currency, amount, ...reasonParts] =
    ctx.message.text.split(" ");

  const reason = reasonParts.join(" ") || "Admin debit";

  if (!telegramId || !currency || !amount) {
    return ctx.reply(
      "Usage:\n/debit <telegram_id> <BTC|USDT> <amount> [reason]"
    );
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) return ctx.reply("Invalid amount.");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const balRes = await client.query(
      `
      SELECT balance
      FROM user_balances
      WHERE telegram_id = $1 AND currency = $2
      FOR UPDATE
      `,
      [telegramId, currency]
    );

    if (!balRes.rows.length) throw new Error("No balance");

    if (Number(balRes.rows[0].balance) < amt) {
      throw new Error("User has insufficient balance");
    }

    // Deduct
    await client.query(
      `
      UPDATE user_balances
      SET balance = balance - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [amt, telegramId, currency]
    );

    // Log
    await client.query(
      `
      INSERT INTO admin_debits
      (admin_id, telegram_id, currency, amount, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [ctx.from.id, telegramId, currency, amt, reason]
    );

    await client.query(
      `
      INSERT INTO transactions
      (telegram_id, currency, amount, type, source, reference)
      VALUES ($1, $2, $3, 'debit', 'admin', $4)
      `,
      [telegramId, currency, amt, `admin:${ctx.from.id}`]
    );

    await client.query("COMMIT");

    ctx.reply(`✅ Debited ${amt} ${currency} from ${telegramId}`);
  } catch (err) {
    await client.query("ROLLBACK");
    ctx.reply("❌ Debit failed: " + err.message);
  } finally {
    client.release();
  }
}
