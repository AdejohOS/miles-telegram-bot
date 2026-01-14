import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawals(ctx) {
  const res = await pool.query(`
    SELECT
      id,
      telegram_id,
      amount_usd,
      payout_currency,
      address,
      created_at
    FROM withdrawal_requests
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 10
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("📭 No pending withdrawals.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const text =
    "💸 *Pending Withdrawals*\n\n" +
    res.rows
      .map(
        (w) =>
          `#${w.id}\n` +
          `User: ${w.telegram_id}\n` +
          `Amount: $${w.amount_usd}\n` +
          `Payout: ${w.payout_currency}\n` +
          `Address: ${w.address}\n`
      )
      .join("\n");

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard(
      res.rows
        .map((w) => [
          Markup.button.callback(
            `✅ Approve #${w.id}`,
            `withdraw_approve_${w.id}`
          ),
          Markup.button.callback(
            `❌ Reject #${w.id}`,
            `withdraw_reject_${w.id}`
          ),
          Markup.button.callback(`💰 Paid #${w.id}`, `withdraw_paid_${w.id}`),
        ])
        .concat([[Markup.button.callback("⬅ Back", "admin_menu")]])
    ).reply_markup,
  });
}
