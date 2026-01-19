# 🤖 Telegram Escrow & Wallet Management Bot

A production-grade **Telegram escrow and wallet management bot** built with **Node.js, Telegraf, and PostgreSQL**.

This project implements real-world financial workflows including **crypto deposits, escrow deals, withdrawals, disputes, and admin moderation**, with strong emphasis on **data integrity, transactional safety, and non-stacking Telegram UX**.



## 🚀 Features

### 👤 User Features
- Telegram-based user registration
- Personal wallet system (one address per user)
  - Bitcoin (BTC)
  - USDT (TRC20)
- Secure balance tracking (available vs locked funds)
- Escrow deal creation & lifecycle management
- Deal acceptance, completion, and cancellation
- Dispute creation for active deals
- Withdrawal requests with admin approval
- Transaction history
- Profile & balance overview



### 🛡️ Admin Features
- Admin dashboard with platform statistics
- Manual credit & debit system
- User sanctions system:
  - Warnings
  - Temporary blocks
  - Permanent bans
- Withdrawal approval / rejection / payout marking
- Escrow dispute resolution
- Shop & item management
- Real-time admin notifications for:
  - Deposit intent (BTC / USDT)
  - Withdrawal requests
  - Dispute events



## 🔒 Security & Reliability
- PostgreSQL transactions (`BEGIN / COMMIT / ROLLBACK`)
- Row-level locking for balance safety
- One-user-one-wallet address enforcement
- Admin-only protected actions
- Session-driven flows to prevent duplicate actions
- No reliance on user-submitted screenshots for deposits

---

## 🧠 System Design Highlights
- **Escrow-based fund locking**
- **Manual admin verification model** (exchange-style)
- **Non-stacking Telegram UI** using `editMessageText`
- **State-machine flows** via Telegraf sessions
- Address pool system for wallet assignment
- Extendable to additional networks or currencies



## 🧰 Tech Stack

- **Node.js**
- **Telegraf** (Telegram Bot Framework)
- **PostgreSQL**
- **JavaScript (ES Modules)**
- **PM2** (Process Manager)



## ⚙️ Installation & Setup

### Clone Repository
```bash
git clone https://github.com/yourusername/miles-telegram-bot.git
cd telegram-escrow-bot
```

```bash
npm install
```


