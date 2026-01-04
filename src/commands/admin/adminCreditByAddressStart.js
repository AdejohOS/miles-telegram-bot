export async function adminCreditByAddressStart(ctx) {
  ctx.session = { awaitingAddress: true };

  await ctx.editMessageText(
    "➕ *Credit by Address*\n\n" +
      "Paste the deposit address below:\n\n" +
      "• BTC address starts with `bc1`\n" +
      "• USDT-TRC20 address starts with `T`",
    { parse_mode: "Markdown" }
  );
}
