export async function addItemCurrency(ctx) {
  if (ctx.session?.step !== "add_item_currency") return;

  const cur = ctx.message.text.toUpperCase();
  if (!["BTC", "USDT"].includes(cur)) return ctx.reply("Use BTC or USDT.");

  ctx.session.currency = cur;
  ctx.session.step = "add_item_stock";

  await ctx.reply("Enter stock quantity:");
}
