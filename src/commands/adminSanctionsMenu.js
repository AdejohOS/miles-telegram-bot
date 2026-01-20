import { Markup } from "telegraf";

export async function adminSanctionsMenu(ctx) {
  await ctx.editMessageText("🛡️ <b>User Sanctions</b>\n\nChoose an action:", {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⚠️ Warn User", "admin_warn_user")],
      [Markup.button.callback("⏸️ Temporary Block", "admin_block_user")],

      [
        Markup.button.callback("🚫 Ban User", "admin_ban_user"),
        Markup.button.callback("♻️ Unban User", "admin_unban_user"),
      ],
      [Markup.button.callback("⬅ Back", "admin_menu")],
    ]).reply_markup,
  });
}
