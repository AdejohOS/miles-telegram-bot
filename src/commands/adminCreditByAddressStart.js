import { Markup } from "telegraf";

export async function adminCreditByAddressStart(ctx) {
  ctx.session = {
    step: "awaiting_address",
    adminMessageId: ctx.callbackQuery.message.message_id,
  };

  await ctx.editMessageText(
    "➕ *Credit by Address*\n\n" +
      "Paste the *deposit address* below.\n\n" +
      "• BTC → starts with `bc1`\n" +
      "• USDT-TRC20 → starts with `T`",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    }
  );
}
