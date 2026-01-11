CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_wallets (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL,          -- BTC, USDT
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_wallet_user
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE,

  CONSTRAINT user_wallet_unique
    UNIQUE (currency, address)
);


CREATE TABLE address_pool (
  id SERIAL PRIMARY KEY,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
  address TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_balances (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
  balance NUMERIC(20, 8) DEFAULT 0,

  CONSTRAINT fk_user_balance
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE,

  CONSTRAINT unique_user_currency
    UNIQUE (telegram_id, currency)
);

CREATE INDEX idx_wallet_address ON user_wallets (address);
CREATE INDEX idx_wallet_user ON user_wallets (telegram_id);

CREATE INDEX idx_pool_currency_used
ON address_pool (currency, used);

CREATE INDEX idx_balance_user ON user_balances (telegram_id);



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

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL,               -- BTC, USDT
  amount NUMERIC(36,18) NOT NULL,        -- positive or negative
  type TEXT NOT NULL,                   -- credit, debit
  source TEXT NOT NULL,                 -- admin, deposit, withdrawal
  reference TEXT,                       -- tx hash / admin id / note
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_tx
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);



CREATE TABLE user_addresses (
  telegram_id BIGINT PRIMARY KEY,
  btc_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  currency TEXT NOT NULL,              -- BTC / USDT
  amount NUMERIC(36,18) NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',       -- pending | approved | rejected | paid
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  CONSTRAINT fk_user_withdrawal
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);

ALTER TABLE user_balances
ADD COLUMN locked NUMERIC(36,18) DEFAULT 0;


-- shop

CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(20,8) NOT NULL,
  currency TEXT NOT NULL,     -- BTC or USDT
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shop_orders (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(20,8) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, paid, delivered, cancelled
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_order FOREIGN KEY (telegram_id)
    REFERENCES users(telegram_id) ON DELETE CASCADE,

  CONSTRAINT fk_item_order FOREIGN KEY (item_id)
    REFERENCES shop_items(id)
);




