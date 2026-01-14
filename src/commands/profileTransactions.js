import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function profileTransactions(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const telegramId = ctx.from.id;

  const res = await pool.query(
    `
    SELECT amount_usd, type, source, reference, created_at
    FROM transactions
    WHERE telegram_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [telegramId]
  );

  if (!res.rows.length) {
    return ctx.editMessageText(
      "📜 <b>Transactions</b>\n\nNo transactions yet.",
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back", "profile")],
        ]).reply_markup,
      }
    );
  }

  const lines = res.rows.map((t) => {
    const icon = t.type === "credit" ? "➕" : "➖";
    const date = new Date(t.created_at).toLocaleString();

    return (
      `${icon} <b>$${Number(t.amount_usd).toFixed(2)}</b>\n` +
      `• ${t.source}${t.reference ? ` (${t.reference})` : ""}\n` +
      `• ${date}`
    );
  });

  await ctx.editMessageText(
    "📜 <b>Recent Transactions</b>\n\n" + lines.join("\n\n"),
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "profile")],
      ]).reply_markup,
    }
  );
}
