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

DROP TABLE IF EXISTS user_balances CASCADE;

CREATE TABLE user_balances (
  telegram_id BIGINT PRIMARY KEY,
  balance_usd NUMERIC(14,2) DEFAULT 0,
  locked_usd  NUMERIC(14,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_balance
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);



CREATE INDEX idx_wallet_address ON user_wallets (address);
CREATE INDEX idx_wallet_user ON user_wallets (telegram_id);

CREATE INDEX idx_pool_currency_used
ON address_pool (currency, used);

CREATE INDEX idx_balance_user ON user_balances (telegram_id);



DROP TABLE IF EXISTS admin_credits;

CREATE TABLE admin_credits (
  id SERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS admin_debits;

CREATE TABLE admin_debits (
  id SERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  reason TEXT,
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
  usd_amount NUMERIC(14,2),
  rate NUMERIC(18,8),
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

DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  type TEXT NOT NULL,        -- credit | debit
  source TEXT NOT NULL,      -- admin | deposit | shop | deal | withdrawal
  reference TEXT,
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


DROP TABLE IF EXISTS withdrawal_requests;

CREATE TABLE withdrawal_requests (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  payout_currency TEXT NOT NULL, -- BTC / USDT
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  CONSTRAINT fk_user_withdrawal
    FOREIGN KEY (telegram_id)
    REFERENCES users (telegram_id)
    ON DELETE CASCADE
);


-- shop

CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC(14,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS shop_orders;

CREATE TABLE shop_orders (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total_usd NUMERIC(14,2) NOT NULL,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user_order FOREIGN KEY (telegram_id)
    REFERENCES users(telegram_id) ON DELETE CASCADE,

  CONSTRAINT fk_item_order FOREIGN KEY (item_id)
    REFERENCES shop_items(id)
);



DROP TABLE IF EXISTS deals;

CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(telegram_id),
  CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES users(telegram_id)
);

CREATE TABLE deal_disputes (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL,
  opened_by BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open | resolved
  resolution TEXT,            -- sender_refund | receiver_paid
  admin_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,

  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);






