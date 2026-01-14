export async function withdrawAmountHandle(ctx) {
  if (ctx.session?.step !== "withdraw_amount") return;

  const amount = Number(ctx.message.text);

  if (!amount || amount <= 0) {
    return ctx.reply("❌ Enter a valid USD amount.");
  }

  ctx.session.amount = amount;
  ctx.session.step = "withdraw_address";

  await ctx.reply(
    "📥 Send destination wallet address:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "request_withdrawal")],
    ])
  );
}
