import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { session } from "telegraf/session";
import { Markup } from "telegraf";

import { startCommand } from "./commands/start.js";
import { depositMenu } from "./commands/depositMenu.js";
import { profileCommand } from "./commands/profile.js";
import { supportCommand } from "./commands/support.js";

import { profileTransactions } from "./commands/profileTransactions.js";
import { requestWithdrawal } from "./commands/requestWithdrawal.js";

import { addBalance, deductBalance } from "./commands/admin.js";

import { adminMenu } from "./commands/adminMenu.js";
import { adminOnly } from "./middlewares/adminOnly.js";
import { depositBTC } from "./commands/depositBtc.js";
import { depositUSDTTRC20 } from "./commands/depositUSDTTRC20.js";

import { adminCreditMenu } from "./commands/adminCreditMenu.js";
import { adminCreditByAddressStart } from "./commands/adminCreditByAddressStart.js";
import { adminHandleAddress } from "./commands/adminHandleAddress.js";
import { adminHandleAmount } from "./commands/adminHandleAmount.js";

import { adminCreditApprove } from "./commands/adminCreditApprove.js";
import { adminCreditReject } from "./commands/adminCreditReject.js";

import { adminFindUserStart } from "./commands/adminFindUserStart.js";
import { adminFindUserHandle } from "./commands/adminFindUserHandle.js";

import { adminCreditFromFoundUser } from "./commands/adminCreditFromFoundUser.js";
import { adminWithdrawals } from "./commands/adminWithdrawals.js";
import { adminWithdrawApprove } from "./commands/adminWithdrawApprove.js";
import { adminWithdrawReject } from "./commands/adminWithdrawReject.js";
import { adminWithdrawPaid } from "./commands/adminWithdrawPaid.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
  }
  return next();
});

// START
bot.start(startCommand);

// deposit
bot.action("deposit_menu", depositMenu);
bot.action("deposit_btc", (ctx) => depositBTC(ctx, "btc"));
bot.action("deposit_usdt_trc20", (ctx) => depositUSDTTRC20(ctx, "usdt_trc20"));
//bot.action("deposit_usdt_erc20", (ctx) => depositAddress(ctx, "usdt_erc20"));

bot.action("profile", profileCommand);
bot.action("support", supportCommand);

bot.action("profile_transactions", profileTransactions);

bot.action("request_withdrawal", requestWithdrawal);
bot.action(/^withdraw_currency_(BTC|USDT)$/, async (ctx) => {
  const currency = ctx.match[1];

  ctx.session.step = "withdraw_amount";
  ctx.session.currency = currency;

  await ctx.editMessageText(
    `💁 <b>Withdrawal</b>\n\nCurrency: <b>${currency}</b>\nEnter amount:`,
    { parse_mode: "HTML" }
  );

  // 🔑 This is REQUIRED
  await ctx.answerCbQuery().catch(() => {});
});

bot.action("community", (ctx) => {
  ctx.reply("🌐 Join our community:\nhttps://t.me/milestraderchat");
});

bot.action(["shop", "escrow", "orders"], async (ctx) => {
  await ctx.reply("🚧 This feature is coming soon.");
});

bot.action("main_menu", startCommand);

// ADMIN COMMANDS
bot.action("admin_menu", adminOnly, adminMenu);
bot.action("admin_credit_menu", adminOnly, adminCreditMenu);
bot.action("admin_credit_address", adminOnly, adminCreditByAddressStart);

bot.action("admin_credit_approve", adminOnly, adminCreditApprove);
bot.action("admin_credit_reject", adminOnly, adminCreditReject);

bot.action("admin_find_user", adminOnly, adminFindUserStart);

bot.action("admin_credit_found_user", adminOnly, adminCreditFromFoundUser);

bot.action(/^credit_currency_(BTC|USDT)$/, adminOnly, async (ctx) => {
  const currency = ctx.match[1];

  if (!ctx.session?.creditUserId) {
    return ctx.answerCbQuery("No user selected.");
  }

  ctx.session.step = "awaiting_amount";
  ctx.session.creditCurrency = currency;
  ctx.session.adminMessageId = ctx.callbackQuery.message.message_id;

  await ctx.editMessageText(
    `➕ *Credit User*\n\nCurrency: *${currency}*\n\nEnter amount to credit:`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Cancel", "admin_menu")],
      ]).reply_markup,
    }
  );
});

bot.action("admin_withdrawals", adminOnly, adminWithdrawals);
bot.action(/withdraw_approve_(\d+)/, adminOnly, (ctx) =>
  adminWithdrawApprove(ctx, ctx.match[1])
);

bot.action(/withdraw_reject_(\d+)/, adminOnly, (ctx) =>
  adminWithdrawReject(ctx, ctx.match[1])
);

bot.action(/withdraw_paid_(\d+)/, adminOnly, (ctx) =>
  adminWithdrawPaid(ctx, ctx.match[1])
);

bot.on("message", async (ctx, next) => {
  if (!ctx.message?.text) return next();

  // Admin multi-step flow
  if (ctx.session?.step) {
    // extra safety: admin check here
    if (!adminOnly(ctx, () => true)) return;

    if (ctx.session.step === "awaiting_address") {
      return adminHandleAddress(ctx);
    }

    if (ctx.session.step === "awaiting_amount") {
      return adminHandleAmount(ctx);
    }
    if (ctx.session?.step === "find_user") {
      return adminFindUserHandle(ctx);
    }
  }

  return next();
});

bot.command("addbalance", adminOnly, addBalance);
bot.command("deductbalance", adminOnly, deductBalance);

bot.catch((err, ctx) => {
  console.error("Bot error:", err);
});

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
