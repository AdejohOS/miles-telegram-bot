import { pool } from "../db.js";
import { Markup } from "telegraf";
import { notifyAdmins } from "../utils/helper.js";

export async function withdrawAddressHandle(ctx) {
  if (ctx.session?.step !== "withdraw_address") return;

  const { network, amount } = ctx.session; // BTC | USDT
  const address = ctx.message.text.trim();
  const telegramId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔒 Lock user USD balance
    const balRes = await client.query(
      `
      SELECT balance_usd, locked_usd
      FROM user_balances
      WHERE telegram_id = $1
      FOR UPDATE
      `,
      [telegramId]
    );

    if (!balRes.rows.length) {
      throw new Error("Balance record not found");
    }

    const balance = Number(balRes.rows[0].balance_usd);
    const locked = Number(balRes.rows[0].locked_usd);
    const available = balance - locked;

    if (amount > available) {
      throw new Error("Insufficient available balance");
    }

    // 🔒 Lock USD
    await client.query(
      `
      UPDATE user_balances
      SET locked_usd = locked_usd + $1
      WHERE telegram_id = $2
      `,
      [amount, telegramId]
    );

    // 📝 Create withdrawal request
    await client.query(
      `
      INSERT INTO withdrawal_requests
      (telegram_id, amount_usd, payout_currency, address)
      VALUES ($1, $2, $3, $4)
      `,
      [telegramId, amount, network, address]
    );

    await client.query("COMMIT");

    // 🔔 Notify admins
    await notifyAdmins(
      ctx.bot,
      `🚨 <b>New Withdrawal Request</b>

👤 User ID: <code>${telegramId}</code>
💵 Amount: <b>$${amount}</b>
🌐 Network: <b>${network}</b>
📍 Address:
<code>${address}</code>`,
      Markup.inlineKeyboard([
        [Markup.button.callback("💸 View Withdrawals", "admin_withdrawals")],
      ]).reply_markup
    );

    ctx.session = null;

    await ctx.reply(
      "✅ <b>Withdrawal request submitted</b>\n\n" +
        `💵 Amount: <b>$${amount}</b>\n` +
        `🌐 Network: <b>${network}</b>\n\n` +
        "Funds are locked pending admin approval.",
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Withdraw failed:", err);
    await ctx.reply("❌ Withdrawal failed: " + err.message);
  } finally {
    client.release();
  }
}
