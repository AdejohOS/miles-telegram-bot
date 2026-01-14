// src/utils/safeEdit.js
export async function safeEdit(ctx, text, options = {}) {
  try {
    await ctx.editMessageText(text, options);
  } catch (err) {
    if (
      err.response?.error_code === 400 &&
      err.response?.description?.includes("message is not modified")
    ) {
      // harmless Telegram error → ignore
      return;
    }
    throw err;
  }
}
