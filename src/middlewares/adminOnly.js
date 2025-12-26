import { ADMIN_ID } from "../config.js";

export function adminOnly(ctx, next) {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("❌ Unauthorized");
  }
  return next();
}
