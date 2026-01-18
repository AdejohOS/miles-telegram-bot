import { pool } from "../db.js";
import { notifyAdmins } from "../utils/helper.js";
import { Markup } from "telegraf";

export async function dealDisputeReason(ctx) {
  if (ctx.session?.step !== "deal_dispute_reason") return;

  const { dealId } = ctx.session;
  const reason = ctx.message.text;
  const userId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE deals
       SET status = 'disputed'
       WHERE id = $1 AND status = 'accepted'`,
      [dealId],
    );

    await client.query(
      `INSERT INTO deal_disputes (deal_id, opened_by, reason)
       VALUES ($1, $2, $3)`,
      [dealId, userId, reason],
    );

    await client.query("COMMIT");
    ctx.session = null;

    await ctx.reply("⚖ Dispute opened. Admin will review.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "deals")],
      ]).reply_markup,
    });

    await notifyAdmins(
      ctx.bot,
      `⚖ <b>New Deal Dispute</b>

Deal ID: <code>${dealId}</code>
Opened by: <code>${userId}</code>

📝 ${reason}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔍 Review Disputes", "admin_disputes")],
      ]).reply_markup,
    );
  } catch (e) {
    await client.query("ROLLBACK");
    ctx.reply("❌ Failed to open dispute.");
  } finally {
    client.release();
  }
}
