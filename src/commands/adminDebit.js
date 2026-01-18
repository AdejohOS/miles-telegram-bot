import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDebit(ctx) {
  if (!ctx.message?.text) return;
  if (ctx.session?.step !== "admin_debit") return;

  const adminId = ctx.from.id;
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

  if (!msgId) {
    return ctx.reply("❌ Admin session expired. Please restart admin menu.");
  }

  const backKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⬅ Back", "admin_menu")],
  ]);

  const edit = (text) =>
    ctx.telegram.editMessageText(chatId, msgId, null, text, {
      parse_mode: "HTML",
      reply_markup: backKeyboard.reply_markup,
    });

  const parts = ctx.message.text.trim().split(" ");

  if (parts.length < 3) {
    return edit(
      "❌ <b>Invalid format</b>\n\n" +
        "Use:\n" +
        "<code>telegram_id | @username | wallet amount reason</code>",
    );
  }

  const identifier = parts[0];
  const amountUsd = Number(parts[1]);
  const reason = parts.slice(2).join(" ");

  if (!amountUsd || amountUsd <= 0) {
    return edit("❌ <b>Invalid amount.</b>");
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

  // 3️⃣ Wallet address
  else {
    const r = await pool.query(
      `SELECT telegram_id FROM user_wallets WHERE address = $1`,
      [identifier],
    );
    telegramId = r.rows[0]?.telegram_id;
  }

  if (!telegramId) {
    return edit("❌ <b>User not found.</b>");
  }

  const userRes = await pool.query(
    `SELECT username FROM users WHERE telegram_id = $1`,
    [telegramId],
  );

  const username = userRes.rows[0]?.username
    ? `@${userRes.rows[0].username}`
    : "N/A";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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

    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd - $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [amountUsd, telegramId],
    );

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

    await edit(
      `✅ <b>Debit Successful</b>\n\n` +
        `<b>User:</b> ${telegramId}\n` +
        `<b>Username:</b> ${username}\n` +
        `<b>Amount:</b> $${amountUsd}`,
    );

    // 🔔 Notify user (separate message is OK)
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

    return edit(`❌ <b>Debit failed</b>\n\n${err.message}`);
  } finally {
    client.release();
  }
}
