import { Markup } from "telegraf";

export async function adminCreditMenu(ctx) {
  await ctx.answerCbQuery();

  const text = "➕ *Credit User*\n\n" + "Choose an action:";

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("➕ Credit by Address", "admin_credit_address")],
      [Markup.button.callback("⬅ Back to Admin", "admin_menu")],
    ]),
  });
}
