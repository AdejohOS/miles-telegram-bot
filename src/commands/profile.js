import { Markup } from "telegraf";
import { pool } from "../db.js";
import { formatBalance } from "../utils/helper.js";

export async function profileCommand(ctx) {
  const telegramId = ctx.from.id;

  const userRes = await pool.query(
    `SELECT created_at, username
     FROM users
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const user = userRes.rows[0];
  if (!user) return ctx.reply("❌ Profile not found.");

  const balRes = await pool.query(
    `SELECT balance_usd, locked_usd
     FROM user_balances
     WHERE telegram_id = $1`,
    [telegramId]
  );

  const dealsRes = await pool.query(
    `
  SELECT
    COUNT(*) AS purchases,
    COALESCE(SUM(amount_usd), 0) AS purchase_amount
  FROM deals
  WHERE receiver_id = $1
    AND status = 'completed'
  `,
    [telegramId]
  );

  const purchases = Number(dealsRes.rows[0].purchases);
  const purchaseAmount = Number(dealsRes.rows[0].purchase_amount);

  const ratingRes = await pool.query(
    `
  SELECT
    ROUND(AVG(r)::numeric, 2) AS avg_rating,
    COUNT(*) AS total_ratings
  FROM (
    SELECT sender_rating AS r
    FROM deals
    WHERE receiver_id = $1 AND sender_rated = true

    UNION ALL

    SELECT receiver_rating
    FROM deals
    WHERE sender_id = $1 AND receiver_rated = true
  ) ratings
  `,
    [telegramId]
  );

  const avgRating = ratingRes.rows[0]?.avg_rating ?? "N";
  const totalRatings = ratingRes.rows[0]?.total_ratings ?? 0;

  const balance = balRes.rows[0]?.balance_usd ?? 0;
  const locked = balRes.rows[0]?.locked_usd ?? 0;
  const available = balance - locked;

  const joined = user.created_at
    ? new Date(user.created_at).toDateString()
    : "N/A";

  const text =
    `👤 <b>Profile</b>\n\n` +
    `Username: @${user.username || "N/A"}\n` +
    `Telegram ID: ${telegramId}\n` +
    `Joined: ${joined}\n\n` +
    `💰 <b>Wallet (USD)</b>\n` +
    `Available: $${formatBalance(available)}\n` +
    `Locked: $${formatBalance(locked)}\n` +
    `Total: $${formatBalance(balance)}\n\n` +
    `<b>📊 Trading Stats</b>\n` +
    `Purchases: ${purchases}pcs\n` +
    `Purchase amount: $${formatBalance(purchaseAmount)}\n` +
    `Ratings: ${avgRating}/5.0\n` +
    `Ratings: ${totalRatings}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📜 Transactions", "profile_transactions")],
    [Markup.button.callback("⬅ Back to Menu", "main_menu")],
  ]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard.reply_markup,
  });
}
