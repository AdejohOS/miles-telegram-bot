import { Markup } from "telegraf";

export async function escrowMenu(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  await ctx.editMessageText("🤝 <b>Deals</b>\n\nSelect an action:", {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("➕ Make a Deal", "deal_create")],
      [Markup.button.callback("📦 Active Deals", "deal_active")],
      [
        Markup.button.callback("⏳ Pending", "deal_pending"),
        Markup.button.callback("✅ Completed", "deal_completed"),
      ],
      [Markup.button.callback("⬅ Back to Main Menu", "main_menu")],
    ]).reply_markup,
  });
}
