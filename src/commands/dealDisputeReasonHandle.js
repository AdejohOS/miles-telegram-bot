import { Markup } from "telegraf";
import { pool } from "../db.js";
import { notifyAdmins } from "../utils/helper.js";

export async function dealDisputeReasonHandle(ctx) {
  if (ctx.session?.step !== "dispute_reason") return;

  const reason = ctx.message.text.trim();
  const { dealId } = ctx.session;
  const openedBy = Number(ctx.from.id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get deal + participants
    const dealRes = await client.query(
      `
      SELECT sender_id, receiver_id, amount_usd, description, status
      FROM deals
      WHERE id = $1
      FOR UPDATE
      `,
      [dealId],
    );

    if (!dealRes.rows.length) {
      throw new Error("Deal not found");
    }

    const { sender_id, receiver_id, amount_usd, description, status } =
      dealRes.rows[0];

    if (status !== "accepted") {
      throw new Error("Deal is not eligible for dispute");
    }

    const existingRes = await client.query(
      `
      SELECT id
      FROM deal_disputes
      WHERE deal_id = $1
        AND status = 'open'
      LIMIT 1
      `,
      [dealId],
    );

    if (existingRes.rows.length) {
      throw new Error("A dispute is already open for this deal");
    }

    const otherParty = openedBy === sender_id ? receiver_id : sender_id;

    // Create dispute
    const disputeRes = await client.query(
      `
      INSERT INTO deal_disputes (deal_id, opened_by, reason)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [dealId, openedBy, reason],
    );

    const disputeId = disputeRes.rows[0].id;

    await client.query("COMMIT");

    ctx.session = {};

    /* ============================
       🔔 NOTIFY OTHER PARTY
    ============================ */
    await ctx.telegram.sendMessage(
      otherParty,
      `⚖ <b>Dispute Opened</b>

Deal ID: <b>#${dealId}</b>
Amount: <b>$${amount_usd}</b>

📝 <b>Deal Description</b>
${description}

🚨 The other party has opened a dispute on this deal.

Please wait while an admin reviews the case.`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("📦 View Deal", "deal_active")],
        ]).reply_markup,
      },
    );

    const userRes = await pool.query(
      `SELECT username FROM users WHERE telegram_id = $1`,
      [openedBy],
    );

    const username = userRes.rows[0]?.username
      ? `@${userRes.rows[0].username}`
      : "N/A";

    await notifyAdmins(
      ctx.telegram,
      `⚖ <b>New Dispute Opened</b>

Dispute ID: <b>#${disputeId}</b>
Deal ID: <b>#${dealId}</b>
Opened by: <b>${username}</b>
Telegram ID: <code>${openedBy}</code>
Amount: <b>$${amount_usd}</b>

📝 Reason:
<blockquote>${reason}</blockquote>`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🛠 Review Disputes", "admin_disputes")],
      ]).reply_markup,
    );

    await ctx.reply(
      "⚖ <b>Dispute opened successfully</b>\n\n" +
        "The other party and admins have been notified.\n" +
        "An admin will review and resolve the dispute.",
      { parse_mode: "HTML" },
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Dispute failed:", err);
    await ctx.reply("❌ Failed to open dispute: " + err.message);
  } finally {
    client.release();
  }
}
