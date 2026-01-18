import { ADMIN_IDS } from "../config.js";
import { Markup } from "telegraf";

export function formatBalance(balance) {
  return Number(balance).toFixed(2);
}

export async function notifyAdmins(telegram, message, keyboard = null) {
  for (const adminId of ADMIN_IDS) {
    try {
      await telegram.sendMessage(adminId, message, {
        parse_mode: "HTML",
        ...(keyboard ? { reply_markup: keyboard } : {}),
      });
    } catch (e) {
      console.error("Admin notify failed:", adminId, e.message);
    }
  }
}

export async function safeEditOrReply(ctx, text, keyboard) {
  const options = {
    parse_mode: "Markdown",
    ...(keyboard ? keyboard : {}),
  };

  if (ctx.callbackQuery?.message) {
    try {
      return await ctx.editMessageText(text, options);
    } catch (e) {
      // Telegram refused edit (message too old, etc.)
    }
  }

  return ctx.reply(text, options);
}
