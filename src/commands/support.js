import { Markup } from "telegraf";

export async function supportCommand(ctx) {
  try {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "🆘 *Support*\n\nTap the button below to chat with support:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.url(
              "💬 Chat with Support",
              "https://t.me/Miles_trader_suport",
            ),
          ],
          [Markup.button.callback("⬅ Back to Menu", "main_menu")],
        ]),
      },
    );
  } catch (err) {
    await ctx.reply(
      "🆘 *Support*\n\nChat with support:\n👉 https://t.me/Miles_trader_suport",
      { parse_mode: "Markdown" },
    );
  }
}
