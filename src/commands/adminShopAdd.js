import { pool } from "../db.js";

export async function addItemTitle(ctx) {
  if (ctx.session?.step !== "add_item_title") return;

  ctx.session.title = ctx.message.text.trim();
  ctx.session.step = "add_item_price";

  await ctx.reply("💲 Enter price in USD:");
}

export async function addItemPrice(ctx) {
  if (ctx.session?.step !== "add_item_price") return;

  const price = Number(ctx.message.text);
  if (!price || price <= 0) return ctx.reply("❌ Invalid price.");

  ctx.session.price_usd = price;
  ctx.session.step = "add_item_stock";

  await ctx.reply("📦 Enter stock quantity:");
}

export async function addItemStock(ctx) {
  if (ctx.session?.step !== "add_item_stock") return;

  const stock = Number(ctx.message.text);
  if (stock < 0) return ctx.reply("❌ Invalid stock.");

  const { title, price_usd } = ctx.session;

  await pool.query(
    `
    INSERT INTO shop_items (title, price_usd, stock)
    VALUES ($1, $2, $3)
    `,
    [title, price_usd, stock]
  );

  ctx.session = null;
  await ctx.reply("✅ Item added successfully.");
}
