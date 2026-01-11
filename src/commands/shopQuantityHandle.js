export async function shopQuantityHandle(ctx) {
  if (ctx.session?.step !== "shop_quantity") return;

  const qty = Number(ctx.message.text);
  if (!qty || qty <= 0) return ctx.reply("Invalid quantity.");

  ctx.session.quantity = qty;
  ctx.session.step = "shop_confirm";

  await ctx.reply("Confirm purchase? Type YES to continue.");
}
