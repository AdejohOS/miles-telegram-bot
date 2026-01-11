export async function addItemPrice(ctx) {
  if (ctx.session?.step !== "add_item_price") return;

  const price = Number(ctx.message.text);
  if (!price || price <= 0) return ctx.reply("Invalid price.");

  ctx.session.price = price;
  ctx.session.step = "add_item_currency";

  await ctx.reply("Enter currency (BTC or USDT):");
}
