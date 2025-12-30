import { ADMIN_IDS } from "../config.js";

export async function adminOnly(ctx, next) {
  const userId = ctx.from?.id;

  if (!ADMIN_IDS.includes(userId)) {
    return ctx.reply("⛔ Access denied.");
  }

  return next();
}
