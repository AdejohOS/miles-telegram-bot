import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDisputes(ctx) {
  const res = await pool.query(
    `
    SELECT 
      d.id AS dispute_id,
      dl.id AS deal_id,

      dl.sender_id,
      us.username  AS sender_username,

      dl.receiver_id,
      ur.username  AS receiver_username,

      dl.description,
      d.reason,
      d.created_at
    FROM deal_disputes d
    JOIN deals dl ON dl.id = d.deal_id

    LEFT JOIN users us ON us.telegram_id = dl.sender_id
    LEFT JOIN users ur ON ur.telegram_id = dl.receiver_id

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

  const escapeHTML = (text = "") =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const text =
    "⚖ <b>Open Disputes</b>\n\n" +
    res.rows
      .map((d) => {
        const senderName = d.sender_username
          ? `@${escapeHTML(d.sender_username)}`
          : "N/A";

        const receiverName = d.receiver_username
          ? `@${escapeHTML(d.receiver_username)}`
          : "N/A";

        const safeDescription = escapeHTML(d.description);
        const safeReason = escapeHTML(d.reason);

        return (
          `<b>Dispute #${d.dispute_id}</b>\n` +
          `Deal: #${d.deal_id}\n` +
          `👤 Sender: ${senderName} (<code>${d.sender_id}</code>)\n` +
          `👤 Receiver: ${receiverName} (<code>${d.receiver_id}</code>)\n\n` +
          `📝 <b>Deal</b>\n${safeDescription}\n\n` +
          `❗ <b>Issue</b>\n${safeReason}\n` +
          `📅 ${new Date(d.created_at).toLocaleString()}`
        );
      })
      .join("\n\n");

  const buttons = res.rows.map((d) => [
    Markup.button.callback(
      `✅ Pay Sender #${d.dispute_id}`,
      `dispute_sender_${d.dispute_id}`,
    ),
    Markup.button.callback(
      `💰 Pay Receiver #${d.dispute_id}`,
      `dispute_receiver_${d.dispute_id}`,
    ),
  ]);

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
