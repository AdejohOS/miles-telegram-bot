import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminCreditApprove(ctx) {
  if (ctx.session?.step !== "confirm_credit") {
    return ctx.answerCbQuery("No pending credit.");
  }

  const { creditUserId, creditCurrency = "MANUAL", creditAmount } = ctx.session;

  try {
    await pool.query("BEGIN");

    await pool.query(
      `UPDATE users
       SET balance = balance + $1
       WHERE telegram_id = $2`,
      [creditAmount, creditUserId]
    );

    await pool.query(
      `INSERT INTO admin_credits (admin_id, telegram_id, currency, amount)
       VALUES ($1, $2, $3, $4)`,
      [ctx.from.id, creditUserId, creditCurrency, creditAmount]
    );

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Admin credit failed:", err);

    return ctx.editMessageText("❌ *Credit failed.* Please try again.", {
      parse_mode: "Markdown",
    });
  }

  // clear session AFTER success
  ctx.session = null;

  await ctx.editMessageText("✅ *Credit approved and applied.*", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
    ]).reply_markup,
  });

  await ctx.telegram.sendMessage(
    creditUserId,
    `🎉 Your ${creditCurrency} deposit has been credited.\nAmount: ${creditAmount}`
  );
}
