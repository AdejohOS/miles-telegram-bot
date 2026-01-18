import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDisputes(ctx) {
  const res = await pool.query(`
    SELECT dd.id AS dispute_id, d.id AS deal_id,
           d.sender_id, d.receiver_id, d.amount_usd, dd.reason
    FROM deal_disputes dd
    JOIN deals d ON d.id = dd.deal_id
    WHERE dd.status = 'open'
    ORDER BY dd.created_at ASC
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("⚖ No open disputes.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const text =
    "⚖ <b>Open Disputes</b>\n\n" +
    res.rows
      .map(
        (d) => `<b>Deal #${d.deal_id}</b>\n💵 $${d.amount_usd}\n📝 ${d.reason}`,
      )
      .join("\n\n");

  const buttons = res.rows.map((d) => [
    Markup.button.callback("💰 Pay Receiver", `dispute_pay_${d.dispute_id}`),
    Markup.button.callback("↩ Refund Sender", `dispute_refund_${d.dispute_id}`),
  ]);

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
