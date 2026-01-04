import { Markup } from "telegraf";

export async function adminMenu(ctx) {
  await ctx.answerCbQuery();

  const text = "🛡️ *Admin Panel*\n\n" + "Choose an action:";

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("➕ Credit User", "admin_credit_menu")],
      [Markup.button.callback("👤 Find User", "admin_find_user")],
      [Markup.button.callback("📊 Stats", "admin_stats")],
      [Markup.button.callback("⬅ Back to Menu", "main_menu")],
    ]),
  });
}
