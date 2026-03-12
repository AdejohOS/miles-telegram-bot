import { Markup } from "telegraf";
const MIN_WITHDRAWAL_USD = 50;
export async function withdrawAmountHandle(ctx) {
  if (ctx.session?.step !== "withdraw_amount") return;

  const amount = Number(ctx.message.text);

  if (!amount || amount <= 0) {
    return ctx.reply("❌ Enter a valid USD amount.");
  }

  if (amount < MIN_WITHDRAWAL_USD) {
    return ctx.reply(`❌ Minimum withdrawal is *$${MIN_WITHDRAWAL_USD}*.`, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "request_withdrawal")],
      ]).reply_markup,
    });
  }

  ctx.session.amount = amount;
  ctx.session.step = "withdraw_address";

  await ctx.reply(
    "📥 Send destination wallet address:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "request_withdrawal")],
    ]),
  );
}
