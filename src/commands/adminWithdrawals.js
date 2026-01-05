import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawals(ctx) {
  const res = await pool.query(
    `
    SELECT id, telegram_id, currency, amount, address, created_at
    FROM withdrawal_requests
    WHERE status = 'pending'
    ORDER BY created_at ASC
    `
  );

  if (!res.rows.length) {
    return ctx.editMessageText("✅ No pending withdrawals.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const w = res.rows[0];

  await ctx.editMessageText(
    `💸 *Withdrawal Request*\n\n` +
      `User ID: \`${w.telegram_id}\`\n` +
      `Currency: ${w.currency}\n` +
      `Amount: ${w.amount}\n` +
      `Address:\n\`${w.address}\`\n`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Approve", `withdraw_approve_${w.id}`),
          Markup.button.callback("❌ Reject", `withdraw_reject_${w.id}`),
        ],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
