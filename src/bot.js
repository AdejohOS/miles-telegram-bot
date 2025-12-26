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

// INLINE BUTTON HANDLERS
bot.action("deposit", async (ctx) => {
  await ctx.answerCbQuery();
  return depositCommand(ctx);
});
bot.action("balance", async (ctx) => {
  await ctx.answerCbQuery();
  return balanceCommand(ctx);
});

bot.action("support", (ctx) => {
  ctx.reply("📞 Support:\nContact @YourSupportUsername");
});

// ADMIN COMMANDS
bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
