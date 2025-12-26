import { Telegraf } from "telegraf";
import dotenv from "dotenv";

import { startCommand } from "./commands/start.js";
import { depositCommand } from "./commands/deposit.js";
import { balanceCommand } from "./commands/balance.js";
import { addBalance, deductBalance } from "./commands/admin.js";
import { adminOnly } from "./middlewares/adminOnly.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(startCommand);
bot.hears("💰 Deposit", depositCommand);
bot.hears("📊 Balance", balanceCommand);

bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

bot.launch();
console.log("🤖 Bot is running...");
