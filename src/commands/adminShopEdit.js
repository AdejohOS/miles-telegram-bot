import { pool } from "../db.js";

export async function editItemPrice(ctx) {
  if (ctx.session?.step !== "edit_item_price") return;

  const price = Number(ctx.message.text);
  if (!price || price <= 0) return ctx.reply("❌ Invalid price.");

  ctx.session.price_usd = price;
  ctx.session.step = "edit_item_stock";

  await ctx.reply("📦 Enter new stock:");
}

export async function editItemStock(ctx) {
  if (ctx.session?.step !== "edit_item_stock") return;

  const stock = Number(ctx.message.text);
  if (stock < 0) return ctx.reply("❌ Invalid stock.");

  await pool.query(
    `
    UPDATE shop_items
    SET price_usd = $1,
        stock = $2
    WHERE id = $3
    `,
    [ctx.session.price_usd, stock, ctx.session.itemId]
  );

  ctx.session = null;
  await ctx.reply("✅ Item updated successfully.");
}
