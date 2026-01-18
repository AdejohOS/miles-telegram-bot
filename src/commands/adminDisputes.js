import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDisputes(ctx) {
  const res = await pool.query(
    `
    SELECT 
      d.id AS dispute_id,
      dl.id AS deal_id,
      dl.sender_id,
      dl.receiver_id,
      dl.description,
      d.reason,
      d.created_at
    FROM deal_disputes d
    JOIN deals dl ON dl.id = d.deal_id
    WHERE d.status = 'open'
    ORDER BY d.created_at ASC
    `,
  );

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
        (d) =>
          `<b>Dispute #${d.dispute_id}</b>\n` +
          `Deal: #${d.deal_id}\n` +
          `Sender: <code>${d.sender_id}</code>\n` +
          `Receiver: <code>${d.receiver_id}</code>\n` +
          `📝 Deal: ${d.description}\n` +
          `❗ Issue: ${d.reason}\n` +
          `📅 ${new Date(d.created_at).toLocaleString()}`,
      )
      .join("\n\n");

  const buttons = res.rows.map((d) => [
    Markup.button.callback("✅ Pay Sender", `dispute_sender_${d.dispute_id}`),
    Markup.button.callback(
      "💰 Pay Receiver",
      `dispute_receiver_${d.dispute_id}`,
    ),
  ]);

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
