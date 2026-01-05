export async function withdrawAmountHandle(ctx) {
  if (ctx.session?.step !== "withdraw_amount") return;

  const amount = Number(ctx.message.text);
  if (!amount || amount <= 0) {
    return ctx.reply("❌ Invalid amount.");
  }

  ctx.session.amount = amount;
  ctx.session.step = "withdraw_address";

  await ctx.reply("📥 Send destination wallet address:");
}
