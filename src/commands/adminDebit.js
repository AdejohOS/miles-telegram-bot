import { pool } from "../db.js";

export async function adminDebit(ctx) {
  if (!ctx.message?.text) return;

  const adminId = ctx.from.id;
  const parts = ctx.message.text.trim().split(" ");

  if (parts.length < 3) {
    return ctx.reply("❌ Invalid format.\n\nUse:\ntelegram_id amount reason");
  }

  const telegramId = Number(parts[0]);
  const amountUsd = Number(parts[1]);
  const reason = parts.slice(2).join(" ");

  if (!telegramId || !amountUsd || amountUsd <= 0) {
    return ctx.reply("❌ Invalid telegram ID or amount.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Lock balance row
    const balRes = await client.query(
      `
      SELECT balance_usd, locked_usd
      FROM user_balances
      WHERE telegram_id = $1
      FOR UPDATE
      `,
      [telegramId]
    );

    if (!balRes.rows.length) {
      throw new Error("User balance not found");
    }

    const { balance_usd, locked_usd } = balRes.rows[0];
    const available = balance_usd - locked_usd;

    if (amountUsd > available) {
      throw new Error("Insufficient available balance");
    }

    // 💸 Deduct USD
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd - $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [amountUsd, telegramId]
    );

    // 🧾 Log transaction
    await client.query(
      `
      INSERT INTO transactions
      (telegram_id, amount_usd, type, source, reference)
      VALUES ($1, $2, 'debit', 'admin', $3)
      `,
      [telegramId, amountUsd, `admin:${adminId} | ${reason}`]
    );

    await client.query("COMMIT");

    ctx.session = null;

    // ✅ Notify admin
    await ctx.reply(
      `✅ Debit successful\n\nUser: ${telegramId}\nAmount: $${amountUsd}`
    );

    // 🔔 Notify user
    await ctx.telegram.sendMessage(
      telegramId,
      `⚠️ <b>Account Debited</b>\n\n` +
        `Amount: <b>$${amountUsd}</b>\n` +
        `Reason: ${reason}`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin debit failed:", err);
    await ctx.reply("❌ Debit failed: " + err.message);
  } finally {
    client.release();
  }
}
