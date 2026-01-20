import { ADMIN_IDS } from "../config.js";
import { pool } from "../db.js";

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

export async function resolveUser(identifier) {
  if (!identifier) return null;

  // Username
  if (identifier.startsWith("@")) {
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [identifier.slice(1)],
    );
    return res.rows[0]?.telegram_id || null;
  }

  // Telegram ID
  const id = Number(identifier);
  if (Number.isNaN(id)) return null;

  const res = await pool.query(
    `SELECT telegram_id FROM users WHERE telegram_id = $1`,
    [id],
  );

  return res.rows[0]?.telegram_id || null;
}
