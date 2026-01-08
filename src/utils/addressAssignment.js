import { pool } from "../db.js";

export async function assignBTCAddress(telegramId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `SELECT address
       FROM address_pool
       WHERE currency = 'BTC'
         AND used = FALSE
       LIMIT 1
       FOR UPDATE`
    );

    if (!res.rows.length) {
      throw new Error("NO_BTC_ADDRESS_AVAILABLE");
    }

    const address = res.rows[0].address;

    await client.query(
      `UPDATE address_pool
       SET used = TRUE
       WHERE address = $1`,
      [address]
    );

    await client.query(
      `INSERT INTO user_wallets (telegram_id, currency, address)
       VALUES ($1, 'BTC', $2)`,
      [telegramId, address]
    );

    await client.query("COMMIT");
    return address;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
