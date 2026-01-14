import { pool } from "../db.js";
import { Markup } from "telegraf";
import { safeEdit } from "../utils/safeEdit.js";

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

  // ✅ EMPTY STATE (safe)
  if (!res.rows.length) {
    return safeEdit(ctx, "📭 No pending withdrawals.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  // Build list text
  const lines = res.rows.map(
    (w) => `#${w.id} | ${w.telegram_id} | ${w.currency} ${w.amount}`
  );

  // Build buttons
  const buttons = res.rows
    .map((w) => [
      Markup.button.callback(`✅ Approve #${w.id}`, `withdraw_approve_${w.id}`),
      Markup.button.callback(`❌ Reject #${w.id}`, `withdraw_reject_${w.id}`),
      Markup.button.callback(`💸 Paid #${w.id}`, `withdraw_paid_${w.id}`),
    ])
    .concat([[Markup.button.callback("⬅ Back", "admin_menu")]]);

  // ✅ MAIN VIEW (safe)
  return safeEdit(ctx, `<b>💸 Pending Withdrawals</b>\n\n${lines.join("\n")}`, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
