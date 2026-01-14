import { Markup } from "telegraf";

export async function adminHandleAmount(ctx) {
  if (ctx.session?.step !== "awaiting_amount") return;

  const amount = Number(ctx.message.text.trim());
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Invalid USD amount.");
  }

  const { adminMessageId, creditUserId, payoutCurrency } = ctx.session;

  ctx.session = {
    step: "confirm_credit",
    adminMessageId,
    creditUserId,
    payoutCurrency,
    creditAmountUsd: amount,
  };

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    adminMessageId,
    null,
    `⚠️ *Confirm Credit*\n\n` +
      `User ID: \`${creditUserId}\`\n` +
      `Deposit Network: ${payoutCurrency}\n` +
      `Credit Amount: *$${amount}*\n\n` +
      `Proceed?`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Approve", "admin_credit_approve"),
          Markup.button.callback("⬅ Back", "admin_credit_address"),
        ],
      ]).reply_markup,
    }
  );
}
