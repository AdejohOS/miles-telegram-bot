import { pool } from "../db.js";
import { Markup } from "telegraf";

/* =========================
   RESOLVE USER (ID or @username)
========================= */
async function resolveUser(identifier) {
  if (!identifier) return null;

  if (identifier.startsWith("@")) {
    const res = await pool.query(
      `SELECT telegram_id FROM users WHERE username = $1`,
      [identifier.slice(1)],
    );
    return res.rows[0]?.telegram_id ?? null;
  }

  const id = Number(identifier);
  if (Number.isNaN(id)) return null;

  const res = await pool.query(
    `SELECT telegram_id FROM users WHERE telegram_id = $1`,
    [id],
  );

  return res.rows[0]?.telegram_id ?? null;
}

/* =========================
   WARN USER
========================= */
export async function adminWarnHandle(ctx) {
  if (ctx.session.step !== "admin_warn") return;

  const [identifier, ...reasonParts] = ctx.message.text.split(" ");
  const reason = reasonParts.join(" ");

  const telegramId = await resolveUser(identifier);
  if (!telegramId) return ctx.reply("❌ User not found.");

  await pool.query(
    `
    INSERT INTO user_sanctions (telegram_id, action, reason, issued_by)
    VALUES ($1, 'warning', $2, $3)
    `,
    [telegramId, reason, ctx.from.id],
  );

  await pool.query(
    `UPDATE users SET warnings_count = warnings_count + 1 WHERE telegram_id=$1`,
    [telegramId],
  );

  await ctx.telegram.sendMessage(
    telegramId,
    `⚠️ <b>Account Warning</b>\n\nReason:\n${reason}`,
    { parse_mode: "HTML" },
  );

  ctx.session = null;

  return ctx.reply("✅ Warning issued.", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_sanctions")],
    ]),
  });
}

/* =========================
   TEMP BLOCK
========================= */
export async function adminBlockHandle(ctx) {
  if (ctx.session.step !== "admin_block") return;

  const [identifier, days, ...reasonParts] = ctx.message.text.split(" ");
  const reason = reasonParts.join(" ");

  const telegramId = await resolveUser(identifier);
  if (!telegramId) return ctx.reply("❌ User not found.");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(days));

  await pool.query(
    `
    INSERT INTO user_sanctions
      (telegram_id, action, reason, issued_by, expires_at)
    VALUES ($1, 'temp_block', $2, $3, $4)
    `,
    [telegramId, reason, ctx.from.id, expiresAt],
  );

  await pool.query(
    `UPDATE users SET is_blocked = true WHERE telegram_id = $1`,
    [telegramId],
  );

  await ctx.telegram.sendMessage(
    telegramId,
    `⏸️ <b>Account Restricted</b>\n\nReason:\n${reason}\n\nEnds: ${expiresAt.toDateString()}`,
    { parse_mode: "HTML" },
  );

  ctx.session = null;

  return ctx.reply("✅ User temporarily blocked.", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_sanctions")],
    ]),
  });
}

/* =========================
   BAN USER
========================= */
export async function adminBanHandle(ctx) {
  if (ctx.session.step !== "admin_ban") return;

  const [identifier, ...reasonParts] = ctx.message.text.split(" ");
  const reason = reasonParts.join(" ");

  const telegramId = await resolveUser(identifier);
  if (!telegramId) return ctx.reply("❌ User not found.");

  await pool.query(
    `
    INSERT INTO user_sanctions (telegram_id, action, reason, issued_by)
    VALUES ($1, 'ban', $2, $3)
    `,
    [telegramId, reason, ctx.from.id],
  );

  await pool.query(
    `
    UPDATE users
    SET is_banned = true,
        is_blocked = true
    WHERE telegram_id = $1
    `,
    [telegramId],
  );

  await ctx.telegram.sendMessage(
    telegramId,
    `🚫 <b>Account Banned</b>\n\nReason:\n${reason}`,
    { parse_mode: "HTML" },
  );

  ctx.session = null;

  return ctx.reply("✅ User permanently banned.", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_sanctions")],
    ]),
  });
}

/* =========================
   UNBAN / UNBLOCK
========================= */
export async function adminUnbanHandle(ctx) {
  if (ctx.session.step !== "admin_unban") return;

  const telegramId = await resolveUser(ctx.message.text.trim());
  if (!telegramId) return ctx.reply("❌ User not found.");

  await pool.query(
    `
    UPDATE users
    SET is_banned = false,
        is_blocked = false
    WHERE telegram_id = $1
    `,
    [telegramId],
  );

  await ctx.telegram.sendMessage(
    telegramId,
    "♻️ <b>Your account has been restored</b>\n\nYou may now use the platform again.",
    { parse_mode: "HTML" },
  );

  ctx.session = null;

  return ctx.reply("✅ User unbanned / unblocked.", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_sanctions")],
    ]),
  });
}
