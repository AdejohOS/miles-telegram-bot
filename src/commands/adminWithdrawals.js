import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function adminWithdrawals(ctx) {
  const res = await pool.query(`
    SELECT
      w.id,
      w.telegram_id,
      u.username,
      w.amount_usd,
      w.payout_currency,
      w.address,
      w.status,
      w.created_at
    FROM withdrawal_requests w
    JOIN users u ON u.telegram_id = w.telegram_id
    WHERE w.status IN ('pending', 'approved')
    ORDER BY w.created_at ASC
    LIMIT 20
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("📭 No pending or approved withdrawals.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const text =
    "<b>💸 Withdrawals Queue</b>\n\n" +
    res.rows
      .map((w) => {
        const username = w.username ? `@${w.username}` : "N/A";

        return (
          `<b>#${w.id}</b>\n` +
          `<b>User:</b> ${username}\n` +
          `<b>Amount:</b> $${w.amount_usd}\n` +
          `<b>Status:</b> ${w.status.toUpperCase()}\n`
        );
      })
      .join("\n");

  const buttons = res.rows.map((w) => {
    if (w.status === "pending") {
      return [
        Markup.button.callback(
          `✅ Approve #${w.id}`,
          `withdraw_approve_${w.id}`,
        ),
        Markup.button.callback(`❌ Reject #${w.id}`, `withdraw_reject_${w.id}`),
      ];
    }

    if (w.status === "approved") {
      return [
        Markup.button.callback(`💰 Pay #${w.id}`, `withdraw_paid_${w.id}`),
      ];
    }
  });

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
