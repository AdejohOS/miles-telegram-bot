import { Markup } from "telegraf";

export async function adminCreditReject(ctx) {
  ctx.session = null;

  await ctx.editMessageText("❌ *Credit cancelled.*", {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
    ]).reply_markup,
  });
}
