<!-- Copilot / AI agent instructions tailored for this repository -->
# Repo overview

- Purpose: lightweight Node.js Telegram bot using Telegraf to manage BTC balances.
- Key runtime pieces:
  - Bot entry: `src/bot.js` (registers handlers and launches the bot)
  - Commands: `src/commands/*` (each exports a handler function, e.g. `depositCommand`)
  - DB access: `src/db.js` exports a `pool` (Postgres `pg` Pool)
  - Configuration: `src/config.js` reads env vars (`ADMIN_ID`, `BTC_ADDRESS`, `ETH_ADDRESS`)
  - Middleware: `src/middlewares/*` (e.g. `adminOnly` enforces `ADMIN_ID`)

# Big picture & data flow

- Telegram events land in `src/bot.js` which delegates to functions in `src/commands`.
- Commands that need persistence import `pool` and run parameterized SQL queries (see `start.js`, `admin.js`, `balance.js`).
- Admin actions use the `adminOnly` middleware which compares `ctx.from.id` to `ADMIN_ID` from `src/config.js`.
- Deposit flow is UI-only here: `deposit.js` shows the BTC address (from `BTC_ADDRESS`) and relies on manual admin confirmation to update balances.

# Developer workflows & commands

- Install & run locally:
  - `npm install`
  - Ensure a `.env` with `BOT_TOKEN`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `ADMIN_ID`, `BTC_ADDRESS`.
  - Start: `npm start` (runs `node src/bot.js`).
- Database: no migration tool present — apply `schema/schema.sql` manually using `psql` or your DB admin tool.

# Project-specific conventions

- ESM modules (`type: module` in `package.json`). Use `import`/`export` consistently.
- Commands export a single named async function and are wired by `src/bot.js` (e.g. `bot.hears("💰 Deposit", depositCommand)`).
- DB usage pattern: import `pool` and call `await pool.query(sql, params)`; SQL is parameterized with `$1, $2`.
- Admin CLI style: admin commands parse raw `ctx.message.text.split(" ")` for args (follow that pattern when adding similar commands).
- Reply markup uses `telegraf.Markup` helpers and `parse_mode: "Markdown"` where needed.

# Integration points & important files

- `src/bot.js` — register handlers and `bot.launch()`.
- `src/commands/deposit.js` — shows how to present on-chain addresses and inline copy buttons.
- `src/commands/admin.js` — examples of DB updates and audit `balance_logs` inserts.
- `schema/schema.sql` — canonical local DB schema.
- `package.json` — start script and ESM setting.

# Agent guidance for edits

- When editing commands: keep exports and function signatures consistent (named async functions). Update `src/bot.js` only if adding new handlers.
- For DB schema changes: update `schema/schema.sql` and note that operators must apply it to the running DB; do not assume migrations will run automatically.
- For env changes: prefer adding new variables to `src/config.js` and read them via `process.env` as existing files do.
- Be conservative with behavioral changes to admin flows (these affect funds); clearly document and run them by a human.

# Quick notes & gotchas

- Amounts are accepted as raw strings in admin commands (`/addbalance <id> <amount>`). Validate/normalize amounts if you modify money logic.
- `ADMIN_ID` is parsed to `Number` in `src/config.js`; ensure tests or local env use numeric admin IDs.
- There are no automated tests or CI in the repo; prefer small, reviewable changes.

If anything here is unclear or you want more examples (SQL conventions, keyboard layouts, or local DB bring-up steps), tell me which area to expand.
