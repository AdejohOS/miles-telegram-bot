import { pool } from "../db.js";

export async function adminDebit(ctx) {
  try {
    let input;

    // From inline UI
    if (ctx.session?.step === "admin_debit") {
      input = ctx.message.text.trim();
    }
    // From /admin_debit command
    else {
      input = ctx.message.text.replace("/admin_debit", "").trim();
    }

    const [telegramId, currencyRaw, amountRaw, ...reasonParts] =
      input.split(" ");

    if (!telegramId || !currencyRaw || !amountRaw) {
      return ctx.reply(
        "Usage:\n<code>telegram_id BTC|USDT amount [reason]</code>",
        { parse_mode: "HTML" }
      );
    }

    const currency = currencyRaw.toUpperCase();
    if (!["BTC", "USDT"].includes(currency)) {
      return ctx.reply("Currency must be BTC or USDT.");
    }

    const amount = Number(amountRaw);
    if (!amount || amount <= 0) {
      return ctx.reply("Invalid amount.");
    }

    const reason = reasonParts.join(" ") || "Admin debit";

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Lock balance row
      const balRes = await client.query(
        `
        SELECT balance
        FROM user_balances
        WHERE telegram_id = $1 AND currency = $2
        FOR UPDATE
        `,
        [telegramId, currency]
      );

      if (!balRes.rows.length) {
        throw new Error("User has no balance in this currency");
      }

      const balance = Number(balRes.rows[0].balance);

      if (balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Deduct
      await client.query(
        `
        UPDATE user_balances
        SET balance = balance - $1
        WHERE telegram_id = $2 AND currency = $3
        `,
        [amount, telegramId, currency]
      );

      // Log admin debit
      await client.query(
        `
        INSERT INTO admin_debits
        (admin_id, telegram_id, currency, amount, reason)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [ctx.from.id, telegramId, currency, amount, reason]
      );

      // Ledger
      await client.query(
        `
        INSERT INTO transactions
        (telegram_id, currency, amount, type, source, reference)
        VALUES ($1, $2, $3, 'debit', 'admin', $4)
        `,
        [telegramId, currency, amount, `admin:${ctx.from.id}`]
      );

      await client.query("COMMIT");

      ctx.session = null;

      await ctx.reply(
        `✅ Debited ${amount} ${currency} from ${telegramId}\nReason: ${reason}`
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Admin debit failed:", err);
    ctx.reply("❌ Debit failed: " + err.message);
  }
}
