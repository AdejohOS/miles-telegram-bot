import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawals(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});
  const res = await pool.query(
    `
    SELECT id, telegram_id, currency, amount, status, address, created_at
    FROM withdrawal_requests
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 10
    `
  );

  if (!res.rows.length) {
    return ctx.editMessageText("📭 No pending withdrawals.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const rows = res.rows.map((w) => {
    return `#${w.id} | ${w.telegram_id} | ${w.currency} ${w.amount}`;
  });

  await ctx.editMessageText(
    "💸 <b>Pending Withdrawals</b>\n\n" + rows.join("\n"),
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard(
        res.rows
          .map((w) => [
            Markup.button.callback(
              `Approve #${w.id}`,
              `withdraw_approve_${w.id}`
            ),
            Markup.button.callback(
              `Reject #${w.id}`,
              `withdraw_reject_${w.id}`
            ),
            Markup.button.callback(`Paid #${w.id}`, `withdraw_paid_${w.id}`),
          ])
          .concat([[Markup.button.callback("⬅ Back", "admin_menu")]])
      ).reply_markup,
    }
  );
}
