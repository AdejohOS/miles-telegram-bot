import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminShopMenu(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const pageSize = 5;
  const page = Number(ctx.match?.[1] || 1);
  const offset = (page - 1) * pageSize;

  /* =========================
     COUNT TOTAL ITEMS
  ========================= */
  const countRes = await pool.query(`SELECT COUNT(*) FROM shop_items`);
  const total = Number(countRes.rows[0].count);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* =========================
     FETCH PAGE DATA
  ========================= */
  const res = await pool.query(
    `
    SELECT id, title, price_usd, stock, active
    FROM shop_items
    ORDER BY id
    LIMIT $1 OFFSET $2
    `,
    [pageSize, offset],
  );

  if (!res.rows.length) {
    return ctx.editMessageText("🛒 No shop items yet.", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("➕ Add Item", "admin_add_item")],
        [Markup.button.callback("⬅ Back", "admin_menu")],
      ]).reply_markup,
    });
  }

  const escapeHTML = (text = "") =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = res.rows.map(
    (i) =>
      `<b>#${i.id}</b> ${i.active ? "🟢" : "🔴"} ${escapeHTML(i.title)}\n` +
      `💲 $${i.price_usd} | 📦 Stock: ${i.stock}`,
  );

  const buttons = [
    [
      Markup.button.callback("➕ Add Item", "admin_add_item"),
      Markup.button.callback("📦 Orders", "admin_shop_orders"),
    ],

    ...res.rows.map((i) => [
      Markup.button.callback(`✏️ Edit #${i.id}`, `admin_edit_item_${i.id}`),
      Markup.button.callback(`🗑 Delete`, `admin_delete_item_${i.id}`),
    ]),
  ];

  /* =========================
     PAGINATION BUTTONS
  ========================= */
  const paginationRow = [];

  if (page > 1) {
    paginationRow.push(
      Markup.button.callback("⬅ Prev", `admin_shop_menu_${page - 1}`),
    );
  }

  paginationRow.push(
    Markup.button.callback(`Page ${page}/${totalPages}`, "ignore"),
  );

  if (page < totalPages) {
    paginationRow.push(
      Markup.button.callback("Next ➡", `admin_shop_menu_${page + 1}`),
    );
  }

  buttons.push(paginationRow);
  buttons.push([Markup.button.callback("⬅ Back", "admin_menu")]);

  await ctx.editMessageText(
    `🛒 <b>Shop Manager</b>\n<i>Page ${page} of ${totalPages}</i>\n\n` +
      lines.join("\n\n"),
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    },
  );
}
