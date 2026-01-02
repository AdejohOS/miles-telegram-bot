const res = await pool.query(
  `SELECT btc_address FROM address_pool
   WHERE used = false
   LIMIT 1`
);

const address = res.rows[0].btc_address;

await pool.query(
  `UPDATE address_pool
   SET used = true
   WHERE btc_address = $1`,
  [address]
);

await pool.query(
  `INSERT INTO user_addresses (telegram_id, btc_address)
   VALUES ($1, $2)`,
  [ctx.from.id, address]
);
