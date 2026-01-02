CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  balance NUMERIC(18,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  telegram_id BIGINT PRIMARY KEY,
  btc_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS address_pool (
  id SERIAL PRIMARY KEY,
  btc_address TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);





CREATE TABLE IF NOT EXISTS balance_logs (
  id SERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  amount NUMERIC(18,8) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deposits (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  btc_address TEXT NOT NULL,
  txid TEXT UNIQUE,
  amount_btc NUMERIC(18,8),
  confirmations INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'credited')) DEFAULT 'pending',
  detected_at TIMESTAMP DEFAULT NOW(),
  credited_at TIMESTAMP
);



CREATE TABLE user_addresses (
  telegram_id BIGINT PRIMARY KEY,
  btc_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);



