import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function shopMenu(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const res = await pool.query(`
    SELECT id, title, price_usd, stock
    FROM shop_items
    WHERE active = true
    ORDER BY id
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("🛒 Shop is empty right now.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back to Main Menu", "main_menu")],
      ]).reply_markup,
    });
  }

  const lines = res.rows.map(
    (i) =>
      `#${i.id} — ${i.title}\n💲 Price: $${i.price_usd} | 📦 Stock: ${i.stock}`
  );

  await ctx.editMessageText("🛒 <b>Shop</b>\n\n" + lines.join("\n\n"), {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(
      res.rows
        .map((i) => [Markup.button.callback(`🛍 Buy ${i.title}`, `buy_${i.id}`)])
        .concat([
          [Markup.button.callback("🔍 Search", "shop_search")],
          [Markup.button.callback("⬅ Back to Main Menu", "main_menu")],
        ])
    ).reply_markup,
  });
}
