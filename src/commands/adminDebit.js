import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDebit(ctx) {
  if (!ctx.message?.text) return;

  const adminId = ctx.from.id;
  const parts = ctx.message.text.trim().split(" ");

  const backKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⬅ Back", "admin_menu")],
  ]);

  if (parts.length < 3) {
    return ctx.reply(
      "❌ Invalid format.\n\nUse:\ntelegram_id | @username | wallet amount reason",
      { reply_markup: backKeyboard.reply_markup },
    );
  }

  const identifier = parts[0];
  const amountUsd = Number(parts[1]);
  const reason = parts.slice(2).join(" ");

  if (!amountUsd || amountUsd <= 0) {
    return ctx.reply("❌ Invalid amount.", {
      reply_markup: backKeyboard.reply_markup,
    });
  }

  let telegramId;

  // 1️⃣ Telegram ID
  if (/^\d+$/.test(identifier)) {
    telegramId = Number(identifier);
  }

  // 2️⃣ Username
  else if (identifier.startsWith("@")) {
    const r = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [identifier.slice(1)],
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  // 3️⃣ Wallet address (BTC / USDT)
  else {
    const r = await pool.query(
      `SELECT telegram_id FROM user_wallets WHERE address = $1`,
      [identifier],
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  if (!telegramId) {
    return ctx.reply("❌ User not found.", {
      reply_markup: backKeyboard.reply_markup,
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Lock balance
    const balRes = await client.query(
      `
      SELECT balance_usd, locked_usd
      FROM user_balances
      WHERE telegram_id = $1
      FOR UPDATE
      `,
      [telegramId],
    );

    if (!balRes.rows.length) {
      throw new Error("User balance not found");
    }

    const { balance_usd, locked_usd } = balRes.rows[0];
    const available = balance_usd - locked_usd;

    if (amountUsd > available) {
      throw new Error("Insufficient available balance");
    }

    // 💸 Debit
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd - $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [amountUsd, telegramId],
    );

    // 🧾 Log
    await client.query(
      `
      INSERT INTO transactions
      (telegram_id, amount_usd, type, source, reference)
      VALUES ($1, $2, 'debit', 'admin', $3)
      `,
      [telegramId, amountUsd, `admin:${adminId} | ${reason}`],
    );

    await client.query("COMMIT");

    ctx.session = null;

    // ✅ Notify admin
    await ctx.reply(
      `✅ Debit successful\n\nUser: ${telegramId}\nAmount: $${amountUsd}`,
      { reply_markup: backKeyboard.reply_markup },
    );

    // 🔔 Notify user
    await ctx.telegram.sendMessage(
      telegramId,
      `⚠️ <b>Account Debited</b>\n\n` +
        `Amount: <b>$${amountUsd}</b>\n` +
        `Reason: ${reason}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin debit failed:", err);

    await ctx.reply("❌ Debit failed: " + err.message, {
      reply_markup: backKeyboard.reply_markup,
    });
  } finally {
    client.release();
  }
}
