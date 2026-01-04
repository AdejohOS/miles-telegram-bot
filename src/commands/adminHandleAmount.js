import { Markup } from "telegraf";

export async function adminHandleAmount(ctx) {
  if (ctx.session?.step !== "awaiting_amount") return;

  const amount = Number(ctx.message.text.trim());
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Invalid amount.");
  }

  const { creditUserId, creditCurrency } = ctx.session;

  ctx.session = {
    step: "confirm_credit",
    creditUserId,
    creditCurrency,
    creditAmount: amount,
  };

  await ctx.reply(
    `⚠️ *Confirm Credit*\n\n` +
      `User ID: \`${creditUserId}\`\n` +
      `Currency: ${creditCurrency}\n` +
      `Amount: *${amount}*\n\n` +
      `Do you want to proceed?`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Approve", "admin_credit_approve"),
          Markup.button.callback("❌ Reject", "admin_credit_reject"),
        ],
      ]).reply_markup,
    }
  );
}
