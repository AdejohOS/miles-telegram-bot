export async function addItemTitle(ctx) {
  if (ctx.session?.step !== "add_item_title") return;

  ctx.session.title = ctx.message.text;
  ctx.session.step = "add_item_price";

  await ctx.reply("Enter price:");
}
