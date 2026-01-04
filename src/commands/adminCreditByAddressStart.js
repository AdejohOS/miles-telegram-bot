import { Markup } from "telegraf";

export async function adminCreditByAddressStart(ctx) {
  ctx.session = { step: "awaiting_address" };

  await ctx.editMessageText(
    "➕ *Credit by Address*\n\n" +
      "Paste the *deposit address* in the chat below.\n\n" +
      "• BTC → starts with `bc1`\n" +
      "• USDT-TRC20 → starts with `T`\n\n" +
      "_Use the normal message box to paste it._",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "admin_credit_menu")],
      ]).reply_markup,
    }
  );
}
