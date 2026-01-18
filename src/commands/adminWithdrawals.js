import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminWithdrawals(ctx) {
  const res = await pool.query(`
    SELECT
      w.id,
      w.telegram_id,
      u.username,
      w.amount_usd,
      w.payout_currency,
      w.address,
      w.created_at
    FROM withdrawal_requests w
    JOIN users u
      ON u.telegram_id = w.telegram_id
    WHERE w.status = 'pending'
    ORDER BY w.created_at ASC
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
    "<b>💸 Pending Withdrawals</b>\n\n" +
    res.rows
      .map((w) => {
        const username = w.username ? `@${w.username}` : "N/A";

        return (
          `<b>#${w.id}</b>\n` +
          `<b>User:</b> ${username}\n` +
          `<b>Telegram ID:</b> ${w.telegram_id}\n` +
          `<b>Amount:</b> $${w.amount_usd}\n` +
          `<b>Payout:</b> ${w.payout_currency}\n` +
          `<b>Address:</b>\n<code>${w.address}</code>\n`
        );
      })
      .join("\n");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(
      res.rows
        .map((w) => [
          Markup.button.callback(
            `✅ Approve #${w.id}`,
            `withdraw_approve_${w.id}`,
          ),
          Markup.button.callback(
            `❌ Reject #${w.id}`,
            `withdraw_reject_${w.id}`,
          ),
          Markup.button.callback(`💰 Paid #${w.id}`, `withdraw_paid_${w.id}`),
        ])
        .concat([[Markup.button.callback("⬅ Back", "admin_menu")]]),
    ).reply_markup,
  });
}
