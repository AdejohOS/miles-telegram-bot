import { Telegraf } from "telegraf";
import dotenv from "dotenv";

import { startCommand } from "./commands/start.js";
import { depositCommand } from "./commands/deposit.js";
import { balanceCommand } from "./commands/balance.js";
import { adminOnly } from "./middlewares/adminOnly.js";
import { addBalance, deductBalance } from "./commands/admin.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// START
bot.start(startCommand);

// REPLY KEYBOARD HANDLERS
bot.hears("💰 Deposit", depositCommand);
bot.hears("👛 Wallet", balanceCommand);

bot.hears("🆘 Support", (ctx) => {
  ctx.reply("🆘 Support\n\nContact: @YourSupportUsername");
});

bot.hears("🌐 Our Community", (ctx) => {
  ctx.reply("🌐 Join our community:\nhttps://t.me/yourgroup");
});

// ADMIN COMMANDS
bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
