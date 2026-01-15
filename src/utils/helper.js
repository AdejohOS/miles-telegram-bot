import { ADMIN_IDS } from "../config.js";

function formatBalance(balance) {
  return Number(balance).toFixed(2);
}
export { formatBalance };

export async function notifyAdmins(bot, message, keyboard = null) {
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.telegram.sendMessage(adminId, message, {
        parse_mode: "HTML",
        ...(keyboard ? { reply_markup: keyboard } : {}),
      });
    } catch (e) {
      console.error("Admin notify failed:", adminId, e.message);
    }
  }
}
