import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminShopOrders(ctx) {
  const res = await pool.query(`
    SELECT o.id, o.telegram_id, i.title, o.quantity, o.price_usd, o.status
    FROM shop_orders o
    JOIN shop_items i ON i.id = o.item_id
    ORDER BY o.created_at DESC
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("📦 No orders yet.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_shop_menu")],
      ]).reply_markup,
    });
  }

  const lines = res.rows.map(
    (o) =>
      `#${o.id} | ${o.title} ×${o.quantity}\n` +
      `💲 $${o.price_usd} | ${o.status}`
  );

  await ctx.editMessageText("📦 <b>Shop Orders</b>\n\n" + lines.join("\n\n"), {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_shop_menu")],
    ]).reply_markup,
  });
}
