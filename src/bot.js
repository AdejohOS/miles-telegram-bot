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

bot.action("deposit", depositCommand);
bot.action("balance", balanceCommand);

bot.action("requestWithdrawal", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("💁 Withdrawal request feature coming soon.");
});

bot.action("support", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("🆘 Support\n\nContact: @YourSupportUsername");
});

bot.action("community", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("🌐 Join our community:\nhttps://t.me/yourgroup");
});

// ADMIN COMMANDS
bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
