import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminHandleAddress(ctx) {
  if (ctx.session?.step !== "awaiting_address") return;

  const address = ctx.message.text.trim();
  const chatId = ctx.chat.id;
  const msgId = ctx.session.adminMessageId;

  let currency;
  if (address.startsWith("bc1")) currency = "BTC";
  else if (address.startsWith("T")) currency = "USDT";
  else return ctx.reply("❌ Invalid address format.");

  const res = await pool.query(
    `
    SELECT u.telegram_id, u.username
    FROM user_wallets w
    JOIN users u ON u.telegram_id = w.telegram_id
    WHERE w.address = $1 AND w.currency = $2
    `,
    [address, currency]
  );

  if (!res.rows.length) {
    return ctx.reply("❌ No user found for this address.");
  }

  const user = res.rows[0];

  ctx.session = {
    step: "awaiting_amount",
    adminMessageId: msgId,
    creditUserId: user.telegram_id,
    payoutCurrency: currency, // BTC | USDT
  };

  await ctx.telegram.editMessageText(
    chatId,
    msgId,
    null,
    `
<b>✅ User Found</b>

<b>Telegram ID:</b> ${user.telegram_id}
<b>Username:</b> ${user.username ? "@" + user.username : "N/A"}
<b>Deposit Network:</b> ${currency}

<b>Enter USD amount to credit:</b>
    `,
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_credit_address")],
      ]).reply_markup,
    }
  );
}
