import { pool } from "../db.js";

export async function shopSearchHandle(ctx) {
  if (ctx.session?.step !== "shop_search") return;

  const q = ctx.message.text.trim();

  const res = await pool.query(
    `
    SELECT id, title, price, currency, stock
    FROM shop_items
    WHERE active = true
      AND LOWER(title) LIKE LOWER($1)
    `,
    [`%${q}%`]
  );

  if (!res.rows.length) {
    return ctx.reply("❌ No items found. Try another keyword.");
  }

  const lines = res.rows.map(
    (i) => `#${i.id} — ${i.title} (${i.price} ${i.currency}, Stock: ${i.stock})`
  );

  ctx.session = null;

  await ctx.reply("🛒 <b>Search Results</b>\n\n" + lines.join("\n"), {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(
      res.rows.map((i) => [
        Markup.button.callback(`Buy ${i.title}`, `buy_${i.id}`),
      ])
    ).reply_markup,
  });
}
