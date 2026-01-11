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
