export async function adminShopOrders(ctx) {
  const res = await pool.query(
    `
    SELECT o.id, o.telegram_id, i.title, o.quantity, o.status
    FROM shop_orders o
    JOIN shop_items i ON i.id = o.item_id
    ORDER BY o.created_at DESC
    `
  );

  if (!res.rows.length) {
    return ctx.editMessageText("📦 No orders.");
  }

  const lines = res.rows.map(
    (o) => `#${o.id} ${o.title} ×${o.quantity} — ${o.status}`
  );

  await ctx.editMessageText("📦 <b>Orders</b>\n\n" + lines.join("\n"), {
    parse_mode: "HTML",
  });
}
