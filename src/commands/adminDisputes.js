import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminDisputes(ctx) {
  const pageSize = 5;

  // Get page from callback like admin_disputes_2
  const page = Number(ctx.match?.[1] || 1);
  const offset = (page - 1) * pageSize;

  /* =========================
     COUNT TOTAL DISPUTES
  ========================= */
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM deal_disputes WHERE status = 'open'`,
  );

  const total = Number(countRes.rows[0].count);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* =========================
     FETCH PAGE DATA
  ========================= */
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
    LIMIT $1 OFFSET $2
    `,
    [pageSize, offset],
  );

  if (!res.rows.length) {
    return ctx.editMessageText("⚖ No open disputes.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  /* =========================
     SAFE HTML ESCAPE
  ========================= */
  const escapeHTML = (text = "") =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* =========================
     BUILD MESSAGE
  ========================= */
  const text =
    `⚖ <b>Open Disputes</b>\n` +
    `<i>Page ${page} of ${totalPages}</i>\n\n` +
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

  /* =========================
     ACTION BUTTONS
  ========================= */
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

  /* =========================
     PAGINATION BUTTONS
  ========================= */
  const paginationRow = [];

  if (page > 1) {
    paginationRow.push(
      Markup.button.callback("⬅ Prev", `admin_disputes_${page - 1}`),
    );
  }

  paginationRow.push(
    Markup.button.callback(`Page ${page}/${totalPages}`, "ignore"),
  );

  if (page < totalPages) {
    paginationRow.push(
      Markup.button.callback("Next ➡", `admin_disputes_${page + 1}`),
    );
  }

  buttons.push(paginationRow);

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
