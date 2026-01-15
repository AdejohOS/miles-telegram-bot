import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function shopQuantityHandle(ctx) {
  if (ctx.session?.step !== "shop_quantity") return;

  const qty = Number(ctx.message.text);
  if (!qty || qty <= 0) return ctx.reply("❌ Invalid quantity.");

  ctx.session.quantity = qty;
  ctx.session.step = "shop_confirm";

  await ctx.reply(`Confirm purchase of *${qty}* item(s)?`, {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ YES", "shop_confirm_yes"),
        Markup.button.callback("❌ Cancel", "shop_menu"),
      ],
    ]).reply_markup,
  });
}

import { pool } from "../db.js";

export async function shopConfirmHandle(ctx) {
  if (ctx.session?.step !== "shop_confirm") return;

  const telegramId = ctx.from.id;
  const { itemId, quantity } = ctx.session;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      `
      SELECT title, price_usd, stock
      FROM shop_items
      WHERE id = $1
      FOR UPDATE
      `,
      [itemId]
    );

    const item = itemRes.rows[0];
    if (!item) throw new Error("Item not found");
    if (item.stock < quantity) throw new Error("Not enough stock");

    const totalUsd = item.price_usd * quantity;

    const balRes = await client.query(
      `
      SELECT balance_usd
      FROM user_balances
      WHERE telegram_id = $1
      FOR UPDATE
      `,
      [telegramId]
    );

    if (!balRes.rows.length || balRes.rows[0].balance_usd < totalUsd) {
      throw new Error("Insufficient balance");
    }

    // Deduct balance
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd - $1
      WHERE telegram_id = $2
      `,
      [totalUsd, telegramId]
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
      (telegram_id, item_id, quantity, price_usd, status)
      VALUES ($1, $2, $3, $4, 'paid')
      `,
      [telegramId, itemId, quantity, totalUsd]
    );

    await client.query("COMMIT");

    ctx.session = null;

    await ctx.reply(
      `✅ Purchase successful!\n\n🛍 ${item.title}\n📦 Quantity: ${quantity}\n💲 Total: $${totalUsd}`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Shop", "shop_menu")],
        ]).reply_markup,
      }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    await ctx.reply("❌ Purchase failed: " + err.message);
  } finally {
    client.release();
  }
}
