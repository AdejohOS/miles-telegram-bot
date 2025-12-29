import { Telegraf } from "telegraf";
import dotenv from "dotenv";

import { startCommand } from "./commands/start.js";
import { depositCommand } from "./commands/deposit.js";
import { balanceCommand } from "./commands/profile.js";
import { adminOnly } from "./middlewares/adminOnly.js";
import { addBalance, deductBalance } from "./commands/admin.js";
import { depositAddress } from "./commands/depositAddress.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// START
bot.start(startCommand);

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
  }
  return next();
});

bot.action("deposit", async (ctx) => {
  await depositCommand(ctx);
});

bot.action("deposit_btc", (ctx) => depositAddress(ctx, "btc"));

// USDT
bot.action("deposit_usdt_trc20", (ctx) => depositAddress(ctx, "usdt_trc20"));

bot.action("deposit_usdt_erc20", (ctx) => depositAddress(ctx, "usdt_erc20"));

bot.action("profile", profileCommand);

bot.action("requestWithdrawal", async (ctx) => {
  await ctx.reply("💁 Withdrawal request feature coming soon.");
});

bot.action("support", (ctx) => {
  ctx.reply("🆘 Support\n\nContact: @YourSupportUsername");
});

bot.action("community", (ctx) => {
  ctx.reply("🌐 Join our community:\nhttps://t.me/milestraderchat");
});

bot.action(["shop", "escrow", "orders"], async (ctx) => {
  await ctx.reply("🚧 This feature is coming soon.");
});

bot.action("main_menu", startCommand);
bot.action("deposit_menu", depositCommand);

bot.catch((err, ctx) => {
  console.error("Bot error:", err);
});

// ADMIN COMMANDS
bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
