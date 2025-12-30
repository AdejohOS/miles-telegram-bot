import { Markup } from "telegraf";
import { pool } from "../db.js";

export async function adminDeposits(ctx) {
  await ctx.answerCbQuery();

  const res = await pool.query(
    `SELECT id, telegram_id, coin, amount_usd
     FROM deposits
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT 1`
  );

  if (res.rowCount === 0) {
    return ctx.editMessageText("✅ No pending deposits.", {
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]),
    });
  }

  const d = res.rows[0];

  const text =
    `⏳ *Pending Deposit*\n\n` +
    `👤 User: ${d.telegram_id}\n` +
    `🪙 Coin: ${d.coin}\n` +
    `💵 Amount: $${d.amount_usd || "N/A"}\n` +
    `🆔 Deposit ID: ${d.id}`;

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ Approve", `admin_approve_${d.id}`),
        Markup.button.callback("❌ Reject", `admin_reject_${d.id}`),
      ],
      [Markup.button.callback("⬅ Back", "admin_menu")],
    ]),
  });
}
