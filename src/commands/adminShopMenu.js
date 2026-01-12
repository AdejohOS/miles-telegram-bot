import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminShopMenu(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const res = await pool.query(
    `
    SELECT id, title, price, currency, stock, active
    FROM shop_items
    ORDER BY id
    `
  );

  if (!res.rows.length) {
    return ctx.editMessageText("🛒 No shop items yet.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Add Item", "admin_add_item")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const lines = res.rows.map(
    (i) =>
      `#${i.id} ${i.active ? "🟢" : "🔴"} ${i.title} — ${i.price} ${
        i.currency
      } (Stock: ${i.stock})`
  );

  await ctx.editMessageText("🛒 <b>Shop Manager</b>\n\n" + lines.join("\n"), {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      // Top control buttons
      [
        Markup.button.callback("➕ Add Item", "admin_add_item"),
        Markup.button.callback("📦 Orders", "admin_shop_orders"),
      ],

      // One row per item (Edit + Delete)
      ...res.rows.map((i) => [
        Markup.button.callback(`✏️ ${i.title}`, `admin_edit_item_${i.id}`),
        Markup.button.callback(`🗑`, `admin_delete_item_${i.id}`),
      ]),

      // Back
      [Markup.button.callback("⬅ Back", "admin_menu")],
    ]).reply_markup,
  });
}
