import { pool } from "../db.js";
import { Markup } from "telegraf";

const PAGE_SIZE = 10;

export async function profileTransactions(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const telegramId = ctx.from.id;

  // Get page from callback: tx_page_0, tx_page_1, ...
  let page = 0;
  if (ctx.callbackQuery?.data?.startsWith("tx_page_")) {
    page = Number(ctx.callbackQuery.data.split("_")[2]) || 0;
  }

  const offset = page * PAGE_SIZE;

  const res = await pool.query(
    `
    SELECT amount_usd, type, source, reference, created_at
    FROM transactions
    WHERE telegram_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [telegramId, PAGE_SIZE + 1, offset] // +1 to detect next page
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

  const hasNext = res.rows.length > PAGE_SIZE;
  const rows = res.rows.slice(0, PAGE_SIZE);

  const lines = rows.map((t) => {
    const sign = t.type === "credit" ? "➕" : "➖";
    const amount = Number(t.amount_usd).toFixed(2);
    const date = new Date(t.created_at).toLocaleString();

    return (
      `${sign} <b>$${amount}</b>\n` +
      `📌 ${t.source.toUpperCase()}\n` +
      `🕒 ${date}`
    );
  });

  const buttons = [];

  if (page > 0) {
    buttons.push(Markup.button.callback("⬅ Prev", `tx_page_${page - 1}`));
  }

  if (hasNext) {
    buttons.push(Markup.button.callback("Next ➡", `tx_page_${page + 1}`));
  }

  await ctx.editMessageText(
    `📜 <b>Transaction History</b>\n\n${lines.join("\n\n")}`,
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        buttons,
        [Markup.button.callback("⬅ Back", "profile")],
      ]).reply_markup,
    }
  );
}
