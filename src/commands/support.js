import { Markup } from "telegraf";

export async function supportCommand(ctx) {
  try {
    // ✅ Only answer if this is a callback query
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    await ctx.editMessageText(
      "🆘 *Support*\n\nTap the button below to chat with support:",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url(
            "💬 Chat with Support",
            "https://t.me/YourSupportUsername"
          ),
          Markup.button.callback("⬅ Back to Menu", "main_menu"),
        ]),
      }
    );
  } catch (err) {
    console.error("Support edit failed:", err.message);

    await ctx.reply(
      "🆘 *Support*\n\nTap below to chat with support:\n" +
        "👉 https://t.me/YourSupportUsername",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url(
            "💬 Chat with Support",
            "https://t.me/YourSupportUsername"
          ),
        ]),
      }
    );
  }
}
