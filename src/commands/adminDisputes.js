export async function adminDisputes(ctx) {
  const res = await pool.query(`
    SELECT d.id, dd.id AS dispute_id, dd.reason, d.amount_usd
    FROM deal_disputes dd
    JOIN deals d ON d.id = dd.deal_id
    WHERE dd.status = 'open'
    ORDER BY dd.created_at ASC
  `);

  if (!res.rows.length) {
    return ctx.editMessageText("⚖ No open disputes.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const text =
    "⚖ <b>Open Disputes</b>\n\n" +
    res.rows
      .map((r) => `<b>Deal #${r.id}</b>\n💵 $${r.amount_usd}\n📝 ${r.reason}`)
      .join("\n\n");

  const buttons = res.rows.map((r) => [
    Markup.button.callback("💰 Pay Receiver", `dispute_pay_${r.dispute_id}`),
    Markup.button.callback("↩ Refund Sender", `dispute_refund_${r.dispute_id}`),
  ]);

  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}
