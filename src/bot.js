import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import session from "telegraf/session";

import { startCommand } from "./commands/start.js";
import { depositMenu } from "./commands/depositMenu.js";
import { profileCommand } from "./commands/profile.js";
import { supportCommand } from "./commands/support.js";

import { addBalance, deductBalance } from "./commands/admin.js";

import { adminMenu } from "./commands/adminMenu.js";
import { adminOnly } from "./middlewares/adminOnly.js";
import { depositBTC } from "./commands/depositBtc.js";
import { depositUSDTTRC20 } from "./commands/depositUSDTTRC20.js";

import { adminCreditMenu } from "./commands/admin/adminCreditMenu.js";
import { adminCreditByAddressStart } from "./commands/admin/adminCreditByAddress.js";
import { adminHandleAddress } from "./commands/admin/adminHandleAddress.js";
import { adminHandleAmount } from "./commands/admin/adminHandleAmount.js";

bot.use(session());

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

// BTC
bot.action("deposit_btc", (ctx) => depositBTC(ctx, "btc"));

// USDT
bot.action("deposit_usdt_trc20", (ctx) => depositUSDTTRC20(ctx, "usdt_trc20"));

//bot.action("deposit_usdt_erc20", (ctx) => depositAddress(ctx, "usdt_erc20"));

bot.action("profile", profileCommand);
bot.action("support", supportCommand);

bot.action("requestWithdrawal", async (ctx) => {
  await ctx.reply("💁 Withdrawal request feature coming soon.");
});

bot.action("community", (ctx) => {
  ctx.reply("🌐 Join our community:\nhttps://t.me/milestraderchat");
});

bot.action(["shop", "escrow", "orders"], async (ctx) => {
  await ctx.reply("🚧 This feature is coming soon.");
});

bot.action("main_menu", startCommand);
bot.action("deposit_menu", depositMenu);

bot.catch((err, ctx) => {
  console.error("Bot error:", err);
});

// ADMIN COMMANDS
bot.action("admin_menu", adminOnly, adminMenu);

bot.action("admin_credit_menu", adminOnly, adminCreditMenu);
bot.action("admin_credit_address", adminOnly, adminCreditByAddressStart);
bot.on("text", adminOnly, adminHandleAddress);
bot.on("text", adminOnly, adminHandleAmount);

bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
