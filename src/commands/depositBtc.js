export async function depositBTC(ctx) {
  const telegramId = ctx.from.id;

  let res = await pool.query(
    `SELECT btc_address
     FROM user_addresses
     WHERE telegram_id = $1`,
    [telegramId]
  );

  let address;

  if (res.rows.length) {
    address = res.rows[0].btc_address;
  } else {
    // assign new address (from pool)
    address = await assignBTCAddress(telegramId);
  }

  await ctx.editMessageText(
    `💰 *BTC Deposit*\n\n` +
      `Send BTC to your personal address:\n\n` +
      `\`${address}\`\n\n` +
      `This address is unique to you.`,
    { parse_mode: "Markdown" }
  );
}
