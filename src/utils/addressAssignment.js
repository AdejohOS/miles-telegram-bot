import { pool } from "../db.js";

export async function assignBTCAddress(telegramId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query(
      `SELECT btc_address
       FROM address_pool
       WHERE used = false
       LIMIT 1
       FOR UPDATE`
    );

    if (!res.rows.length) {
      throw new Error("No addresses available");
    }

    const address = res.rows[0].btc_address;

    await client.query(
      `UPDATE address_pool SET used = true WHERE btc_address = $1`,
      [address]
    );

    await client.query(
      `INSERT INTO user_addresses (telegram_id, btc_address)
       VALUES ($1, $2)`,
      [telegramId, address]
    );

    await client.query("COMMIT");
    return address;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
