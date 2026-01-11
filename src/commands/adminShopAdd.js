import { pool } from "../db.js";

export async function addItemTitle(ctx) {
  if (ctx.session?.step !== "add_item_title") return;

  ctx.session.title = ctx.message.text;
  ctx.session.step = "add_item_price";

  await ctx.reply("Enter price:");
}

export async function addItemPrice(ctx) {
  if (ctx.session?.step !== "add_item_price") return;

  const price = Number(ctx.message.text);
  if (!price || price <= 0) return ctx.reply("Invalid price.");

  ctx.session.price = price;
  ctx.session.step = "add_item_currency";

  await ctx.reply("Enter currency (BTC or USDT):");
}

export async function addItemCurrency(ctx) {
  if (ctx.session?.step !== "add_item_currency") return;

  const cur = ctx.message.text.toUpperCase();
  if (!["BTC", "USDT"].includes(cur)) return ctx.reply("Use BTC or USDT.");

  ctx.session.currency = cur;
  ctx.session.step = "add_item_stock";

  await ctx.reply("Enter stock quantity:");
}

export async function addItemStock(ctx) {
  if (ctx.session?.step !== "add_item_stock") return;

  const stock = Number(ctx.message.text);
  if (stock < 0) return ctx.reply("Invalid stock.");

  const { title, price, currency } = ctx.session;

  await pool.query(
    `
    INSERT INTO shop_items (title, price, currency, stock)
    VALUES ($1, $2, $3, $4)
    `,
    [title, price, currency, stock]
  );

  ctx.session = null;
  ctx.reply("✅ Item added.");
}
