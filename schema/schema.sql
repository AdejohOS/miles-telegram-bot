CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS address_pool_trc20 (
  id SERIAL PRIMARY KEY,
  tron_address TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);


ALTER TABLE user_addresses
ADD COLUMN usdt_trc20_address TEXT UNIQUE;


CREATE TABLE IF NOT EXISTS admin_credits (
  id SERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL, -- BTC | USDT
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_balances (
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL, -- 'BTC', 'USDT'
  balance NUMERIC(36,18) DEFAULT 0,
  PRIMARY KEY (telegram_id, currency),
  CONSTRAINT fk_user
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deposit_logs (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL,         -- 'BTC' | 'USDT'
  address TEXT NOT NULL,
  tx_hash TEXT UNIQUE,
  amount NUMERIC(36,18) NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
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



