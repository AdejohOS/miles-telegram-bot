import { MIN_DEPOSIT_USD } from "../config.js";
import { Markup } from "telegraf";
import { pool } from "../db.js";
import { assignBTCAddress } from "../utils/addressAssignment.js";
import { notifyAdmins } from "../utils/helper.js";

export async function depositBTC(ctx) {
  const telegramId = ctx.from.id;
  try {
    const res = await pool.query(
      `SELECT address
     FROM user_wallets
     WHERE telegram_id = $1 AND currency = 'BTC'`,
      [telegramId],
    );

    let address;

    if (res.rows.length) {
      address = res.rows[0].address;
    } else {
      address = await assignBTCAddress(telegramId);
    }

    // 🔔 Deposit intent notification (BTC) — session-guarded
    ctx.session.depositIntent ??= {};

    if (!ctx.session.depositIntent.BTC) {
      const userRes = await pool.query(
        `SELECT username FROM users WHERE telegram_id = $1`,
        [telegramId],
      );

      const username = userRes.rows[0]?.username
        ? `@${userRes.rows[0].username}`
        : "N/A";

      await notifyAdmins(
        ctx.telegram,
        `🔔 <b>Deposit Intent (BTC)</b>

👤 <b>User:</b> ${username}
🆔 <b>Telegram ID:</b> <code>${telegramId}</code>

🏦 <b>Network:</b> Bitcoin
📍 <b>Address:</b>
<code>${address}</code>

⏳ User has opened BTC deposit screen.`,
      );

      ctx.session.depositIntent.BTC = true;
    }

    const text =
      `💰 *BTC Deposit*\n\n` +
      `Send BTC to your personal address:\n\n` +
      `\`${address}\`\n\n` +
      `💵 *Minimum deposit:* $${MIN_DEPOSIT_USD}\n` +
      `This address is unique to you.\n\n` +
      `ℹ Balance updates after payment is completed\n\n` +
      `📋 _Tap the address to copy_`;

    if (ctx.callbackQuery?.message) {
      return ctx.editMessageText(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
        ]),
      });
    }

    return ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
      ]),
    });
  } catch (err) {
    const errorText =
      err.message === "NO_BTC_ADDRESS_AVAILABLE_CONTACT_SUPPORT"
        ? "⚠️ *BTC deposits are temporarily unavailable*\n\n" +
          "All deposit addresses are currently in use.\n" +
          "Please try again later."
        : "❌ *An unexpected error occurred*\n\n" + "Please try again later.";

    const options = {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Deposit Menu", "deposit_menu")],
      ]),
    };

    if (ctx.callbackQuery?.message) {
      return ctx.editMessageText(errorText, options);
    }

    return ctx.reply(errorText, options);
  }
}
