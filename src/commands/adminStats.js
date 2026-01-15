import { pool } from "../db.js";
import { Markup } from "telegraf";

export async function adminStats(ctx) {
  await ctx.answerCbQuery?.().catch(() => {});

  const [usersRes, balanceRes, withdrawRes, dealsRes, ordersRes] =
    await Promise.all([
      // 👥 Users
      pool.query(`SELECT COUNT(*) FROM users`),

      // 💰 Balances
      pool.query(`
      SELECT
        COALESCE(SUM(balance_usd), 0) AS total_balance,
        COALESCE(SUM(locked_usd), 0) AS total_locked
      FROM user_balances
    `),

      // 💸 Withdrawals
      pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'paid') AS paid
      FROM withdrawal_requests
    `),

      // 🤝 Deals
      pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'accepted') AS active,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM deals
    `),

      // 🛒 Shop
      pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'paid') AS orders,
        COALESCE(SUM(price_usd), 0) AS revenue
      FROM shop_orders
    `),
    ]);

  const users = usersRes.rows[0].count;
  const balance = balanceRes.rows[0];
  const withdrawals = withdrawRes.rows[0];
  const deals = dealsRes.rows[0];
  const shop = ordersRes.rows[0];

  const text =
    `<b>📊 Admin Statistics</b>\n\n` +
    `<b>👥 Users</b>\n` +
    `• Total users: <b>${users}</b>\n\n` +
    `<b>💰 Balances (USD)</b>\n` +
    `• Total balance: <b>$${Number(balance.total_balance).toFixed(2)}</b>\n` +
    `• Locked funds: <b>$${Number(balance.total_locked).toFixed(2)}</b>\n\n` +
    `<b>💸 Withdrawals</b>\n` +
    `• Pending: <b>${withdrawals.pending}</b>\n` +
    `• Paid: <b>${withdrawals.paid}</b>\n\n` +
    `<b>🤝 Deals</b>\n` +
    `• Pending: <b>${deals.pending}</b>\n` +
    `• Active: <b>${deals.active}</b>\n` +
    `• Completed: <b>${deals.completed}</b>\n\n` +
    `<b>🛒 Shop</b>\n` +
    `• Paid orders: <b>${shop.orders}</b>\n` +
    `• Revenue: <b>$${Number(shop.revenue).toFixed(2)}</b>`;

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "admin_menu")],
    ]).reply_markup,
  });
}
