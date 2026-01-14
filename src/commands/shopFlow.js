import { pool } from "../db.js";
export async function shopQuantityHandle(ctx) {
  if (ctx.session?.step !== "shop_quantity") return;

  const qty = Number(ctx.message.text);
  if (!qty || qty <= 0) return ctx.reply("Invalid quantity.");

  ctx.session.quantity = qty;
  ctx.session.step = "shop_confirm";

  await ctx.reply("Confirm purchase? Type YES to continue.");
}

export async function shopConfirmHandle(ctx) {
  if (ctx.session?.step !== "shop_confirm") return;
  if (ctx.message.text.toLowerCase() !== "yes") return ctx.reply("Cancelled.");

  const telegramId = ctx.from.id;
  const { itemId, quantity } = ctx.session;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      `
      SELECT title, price, currency, stock
      FROM shop_items
      WHERE id = $1
      FOR UPDATE
      `,
      [itemId]
    );

    const item = itemRes.rows[0];
    if (!item || item.stock < quantity) throw new Error("Out of stock");

    const total = item.price * quantity;

    const balRes = await client.query(
      `
      SELECT balance
      FROM user_balances
      WHERE telegram_id = $1 AND currency = $2
      FOR UPDATE
      `,
      [telegramId, item.currency]
    );

    if (!balRes.rows.length || balRes.rows[0].balance < total)
      throw new Error("Insufficient balance");

    // Deduct balance
    await client.query(
      `
      UPDATE user_balances
      SET balance = balance - $1
      WHERE telegram_id = $2 AND currency = $3
      `,
      [total, telegramId, item.currency]
    );

    // Reduce stock
    await client.query(
      `
      UPDATE shop_items
      SET stock = stock - $1
      WHERE id = $2
      `,
      [quantity, itemId]
    );

    // Create order
    await client.query(
      `
      INSERT INTO shop_orders
      (telegram_id, item_id, quantity, price, currency, status)
      VALUES ($1, $2, $3, $4, $5, 'paid')
      `,
      [telegramId, itemId, quantity, total, item.currency]
    );

    await client.query("COMMIT");

    ctx.session = null;
    await ctx.reply(`✅ Purchased ${item.title} ×${quantity}`);
  } catch (err) {
    await client.query("ROLLBACK");
    await ctx.reply("❌ Purchase failed: " + err.message);
  } finally {
    client.release();
  }
}
