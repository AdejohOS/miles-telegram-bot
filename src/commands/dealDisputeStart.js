import { Markup } from "telegraf";

export async function dealDisputeStart(ctx) {
  const dealId = ctx.match[1];

  ctx.session = {
    step: "deal_dispute_reason",
    dealId,
  };

  await ctx.editMessageText(
    "⚖ <b>Open Dispute</b>\n\nPlease explain the issue:",
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "deals")],
      ]).reply_markup,
    },
  );
}
