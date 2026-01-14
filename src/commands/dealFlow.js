export async function dealReceiver(ctx) {
  const input = ctx.message.text;

  const res = input.startsWith("@")
    ? await pool.query(`SELECT telegram_id FROM users WHERE username = $1`, [
        input.slice(1),
      ])
    : await pool.query(`SELECT telegram_id FROM users WHERE telegram_id = $1`, [
        input,
      ]);

  if (!res.rows.length) return ctx.reply("User not found.");

  ctx.session.receiverId = res.rows[0].telegram_id;
  ctx.session.step = "deal_amount";

  ctx.reply("Enter amount:");
}

export async function dealAmount(ctx) {
  const amount = Number(ctx.message.text);
  if (!amount || amount <= 0) return ctx.reply("Invalid amount");

  ctx.session.amount = amount;
  ctx.session.step = "deal_currency";
  ctx.reply("Currency: BTC or USDT?");
}

export async function dealCurrency(ctx) {
  const cur = ctx.message.text.toUpperCase();
  if (!["BTC", "USDT"].includes(cur)) return ctx.reply("Use BTC or USDT");

  ctx.session.currency = cur;
  ctx.session.step = "deal_desc";
  ctx.reply("Describe the deal:");
}

export async function dealDesc(ctx) {
  const desc = ctx.message.text;
  const { receiverId, amount, currency } = ctx.session;
  const senderId = ctx.from.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bal = await client.query(
      `SELECT balance, locked FROM user_balances
       WHERE telegram_id=$1 AND currency=$2
       FOR UPDATE`,
      [senderId, currency]
    );

    if (!bal.rows.length) {
      throw new Error("You have no balance in this currency");
    }

    const available = bal.rows[0].balance - bal.rows[0].locked;
    if (amount > available) throw new Error("Insufficient funds");

    await client.query(
      `UPDATE user_balances
       SET locked = locked + $1
       WHERE telegram_id=$2 AND currency=$3`,
      [amount, senderId, currency]
    );

    const deal = await client.query(
      `INSERT INTO deals (sender_id, receiver_id, currency, amount, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [senderId, receiverId, currency, amount, desc]
    );

    await client.query("COMMIT");

    ctx.session = null;

    ctx.reply(`🤝 Deal #${deal.rows[0].id} created and awaiting acceptance.`);

    ctx.telegram.sendMessage(
      receiverId,
      `📨 You have a new deal request\nAmount: ${amount} ${currency}\n${desc}\n\nAccept or reject in Deals`
    );
  } catch (e) {
    await client.query("ROLLBACK");
    ctx.reply("❌ " + e.message);
  } finally {
    client.release();
  }
}
