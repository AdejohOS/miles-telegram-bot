import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminCreditApprove(ctx) {
  if (ctx.session?.step !== "confirm_credit") {
    return ctx.answerCbQuery("No pending credit.");
  }

  const { creditUserId, creditAmountUsd } = ctx.session;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO user_balances (telegram_id, balance_usd)
      VALUES ($1, 0)
      ON CONFLICT (telegram_id) DO NOTHING
      `,
      [creditUserId]
    );

    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd + $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [creditAmountUsd, creditUserId]
    );

    await client.query("COMMIT");

    ctx.session = null;

    await ctx.editMessageText(
      `✅ *Credit Successful*\n\nUser credited *$${creditAmountUsd}*`,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
        ]).reply_markup,
      }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    ctx.reply("❌ Credit failed: " + err.message);
  } finally {
    client.release();
  }
}
