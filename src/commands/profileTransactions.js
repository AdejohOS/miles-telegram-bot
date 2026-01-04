import { pool } from "../db.js";
import { Markup } from "telegraf";
import { formatBalance } from "../utils/helper.js";

export async function profileTransactions(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const telegramId = ctx.from.id;

  const res = await pool.query(
    `
    SELECT currency, amount, type, source, created_at
    FROM transactions
    WHERE telegram_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [telegramId]
  );

  if (!res.rows.length) {
    return ctx.editMessageText("📜 *Transactions*\n\nNo transactions yet.", {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "profile")],
      ]).reply_markup,
    });
  }

  const lines = res.rows.map((t) => {
    const sign = t.type === "credit" ? "+" : "-";
    const amt = formatBalance(t.amount);
    const date = new Date(t.created_at).toLocaleDateString();

    return `${date} • ${t.currency} ${sign}${amt} (${t.source})`;
  });

  await ctx.editMessageText(`📜 *Recent Transactions*\n\n${lines.join("\n")}`, {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "profile")],
    ]).reply_markup,
  });
}
