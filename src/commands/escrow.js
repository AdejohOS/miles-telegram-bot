import { Markup } from "telegraf";

export async function escrowMenu(ctx) {
  await ctx.answerCbQuery();

  const text = "🤝 *Deals*\n\n";

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("➕ Make a Deal", "deal_create")],
      [Markup.button.callback("⏳ Awaiting", "deal_pending")],
      [Markup.button.callback("📦 Active", "deal_active")],
      [Markup.button.callback("⚖ Disputes", "deal_disputes")],
      [Markup.button.callback("✅ Completed", "deal_completed")],
      [Markup.button.callback("⬅ Back to Main Menu", "main_menu")],
    ]),
  });
}
