export async function adminCreditApprove(ctx) {
  if (ctx.session?.step !== "confirm_credit") {
    return ctx.answerCbQuery("No pending credit.");
  }

  const { creditUserId, creditAmountUsd, payoutCurrency } = ctx.session;
  const adminId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Ensure balance row exists
    await client.query(
      `
      INSERT INTO user_balances (telegram_id, balance_usd)
      VALUES ($1, 0)
      ON CONFLICT (telegram_id) DO NOTHING
      `,
      [creditUserId]
    );

    // 2️⃣ Update balance (REAL money movement)
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd + $1,
          updated_at = NOW()
      WHERE telegram_id = $2
      `,
      [creditAmountUsd, creditUserId]
    );

    // ✅ 3️⃣ LOG TRANSACTION (THIS IS THE CORRECT SPOT)
    await client.query(
      `
      INSERT INTO transactions
        (telegram_id, amount_usd, type, source, reference)
      VALUES ($1, $2, 'credit', 'deposit', $3)
      `,
      [creditUserId, creditAmountUsd, `admin:${adminId} (${payoutCurrency})`]
    );

    // 4️⃣ Commit everything together
    await client.query("COMMIT");

    ctx.session = null;

    // Admin confirmation
    await ctx.editMessageText(
      `✅ <b>Credit Successful</b>\n\nUser credited <b>$${creditAmountUsd}</b>`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback("⬅ Back to Admin Menu", "admin_menu")],
        ]).reply_markup,
      }
    );

    // User notification
    await ctx.telegram.sendMessage(
      creditUserId,
      `💰 <b>Account Credited</b>\n\n` +
        `Amount: <b>$${creditAmountUsd}</b>\n` +
        `Source: <b>${payoutCurrency}</b>\n\n` +
        `You can now use your balance.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin credit failed:", err);
    await ctx.reply("❌ Credit failed: " + err.message);
  } finally {
    client.release();
  }
}
