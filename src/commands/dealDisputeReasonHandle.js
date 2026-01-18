import { Markup } from "telegraf";
import { pool } from "../db.js";
import { notifyAdmins } from "../utils/helper.js";

export async function dealDisputeReasonHandle(ctx) {
  if (ctx.session?.step !== "dispute_reason") return;

  const reason = ctx.message.text.trim();
  const { dealId } = ctx.session;
  const userId = Number(ctx.from.id);

  await pool.query(
    `
    INSERT INTO deal_disputes (deal_id, opened_by, reason)
    VALUES ($1, $2, $3)
    `,
    [dealId, userId, reason],
  );

  ctx.session = null;

  // Notify admins
  await notifyAdmins(
    ctx.bot,
    `⚖ <b>New Dispute Opened</b>

Deal ID: <b>#${dealId}</b>
Opened by: <code>${userId}</code>
Reason:
<blockquote>${reason}</blockquote>`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🛠 Review Disputes", "admin_disputes")],
    ]).reply_markup,
  );

  await ctx.reply(
    "⚖ <b>Dispute opened successfully</b>\n\nAdmin will review and resolve.",
    { parse_mode: "HTML" },
  );
}
