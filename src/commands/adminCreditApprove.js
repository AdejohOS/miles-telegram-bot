import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminCreditApprove(ctx) {
  if (ctx.session?.step !== "confirm_credit") {
    return ctx.answerCbQuery("No pending credit.");
  }

  const { creditUserId, creditAmountUsd, payoutCurrency } = ctx.session;
  const adminId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Ensure balance row exists
    await client.query(
      `
      INSERT INTO user_balances (telegram_id, balance_usd)
      VALUES ($1, 0)
      ON CONFLICT (telegram_id) DO NOTHING
      `,
      [creditUserId]
    );

    // Credit USD balance
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd + $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [creditAmountUsd, creditUserId]
    );

    // Optional: log transaction (recommended)
    await client.query(
      `
      INSERT INTO transactions
      (telegram_id, amount, type, source, reference)
      VALUES ($1, $2, 'credit', 'deposit', $3)
      `,
      [creditUserId, creditAmountUsd, `admin:${adminId}`]
    );

    await client.query("COMMIT");

    // 🧼 clear session
    ctx.session = null;

    // ✅ Notify ADMIN
    await ctx.editMessageText(
      `✅ *Credit Successful*\n\nUser credited *$${creditAmountUsd}*`,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
        ]).reply_markup,
      }
    );

    // 🔔 Notify USER (THIS WAS MISSING)
    await ctx.telegram.sendMessage(
      creditUserId,
      `💰 *Account Credited*\n\n` +
        `Amount: *$${creditAmountUsd}*\n` +
        `Source: ${payoutCurrency} deposit\n\n` +
        `You can now use your balance.`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin credit failed:", err);
    await ctx.reply("❌ Credit failed: " + err.message);
  } finally {
    client.release();
  }
}
