import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { session } from "telegraf/session";
import { Markup } from "telegraf";
import { ADMIN_IDS } from "./config.js";
import { pool } from "./db.js";

import { startCommand } from "./commands/start.js";
import { depositMenu } from "./commands/depositMenu.js";
import { profileCommand } from "./commands/profile.js";
import { supportCommand } from "./commands/support.js";
import { shopMenu } from "./commands/shopMenu.js";

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

import { adminWithdrawals } from "./commands/adminWithdrawals.js";
import { adminWithdrawApprove } from "./commands/adminWithdrawApprove.js";
import { adminWithdrawReject } from "./commands/adminWithdrawReject.js";
import { adminWithdrawPaid } from "./commands/adminWithdrawPaid.js";

import { adminShopMenu } from "./commands/adminShopMenu.js";

import { withdrawAmountHandle } from "./commands/withdrawAmountHandle.js";
import { withdrawAddressHandle } from "./commands/withdrawAddressHandle.js";

import { shopQuantityHandle, shopConfirmHandle } from "./commands/shopFlow.js";
import { shopSearchHandle } from "./commands/shopSearchHandle.js";

import { adminDebit } from "./commands/adminDebit.js";

import {
  addItemTitle,
  addItemPrice,
  addItemStock,
} from "./commands/adminShopAdd.js";

import { escrowMenu } from "./commands/escrow.js";
import { dealReceiver, dealAmount, dealDesc } from "./commands/dealFlow.js";

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

//Shop
bot.action("shop_menu", shopMenu);
bot.action(/buy_(\d+)/, async (ctx) => {
  const itemId = ctx.match[1];

  ctx.session = {
    step: "shop_quantity",
    itemId,
    messageId: ctx.callbackQuery.message.message_id,
  };

  await ctx.editMessageText("🛍 Enter quantity to buy:", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Shop", "shop_menu")],
    ]).reply_markup,
  });
});

bot.action("shop_confirm_yes", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return shopConfirmHandle(ctx);
});

bot.action(/admin_delete_item_(\d+)/, adminOnly, async (ctx) => {
  const id = ctx.match[1];

  await pool.query(`UPDATE shop_items SET active = false WHERE id = $1`, [id]);

  await ctx.editMessageText("🗑 Item removed.", {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back to Shop", "admin_shop_menu")],
    ]).reply_markup,
  });
});

bot.action(/admin_edit_item_(\d+)/, adminOnly, async (ctx) => {
  const id = ctx.match[1];

  ctx.session = {
    step: "edit_item_price",
    itemId: id,
  };

  await ctx.editMessageText(`Enter new price for item #${id}`);
});

bot.action("shop_search", async (ctx) => {
  ctx.session = { step: "shop_search" };
  await ctx.editMessageText("🔍 Enter item name or keyword:");
});
bot.action("deals", escrowMenu);

bot.action("deal_create", async (ctx) => {
  ctx.session = { step: "deal_receiver" };

  await ctx.editMessageText(
    "👤 <b>Create Deal</b>\n\nSend receiver @username or Telegram ID:",
    {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback("⬅ Cancel", "deals"),
      ]).reply_markup,
    }
  );
});

bot.action(/deal_complete_(\d+)/, async (ctx) => {
  const id = ctx.match[1];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT sender_id, receiver_id, amount_usd
      FROM deals
      WHERE id = $1 AND status = 'accepted'
      FOR UPDATE
      `,
      [id]
    );

    if (!res.rows.length) throw new Error("Deal not valid");

    const { sender_id, receiver_id, amount_usd } = res.rows[0];

    // Deduct sender (locked → spent)
    await client.query(
      `
      UPDATE user_balances
      SET locked_usd = locked_usd - $1,
          balance_usd = balance_usd - $1
      WHERE telegram_id = $2
      `,
      [amount_usd, sender_id]
    );

    // Pay receiver
    await client.query(
      `
      UPDATE user_balances
      SET balance_usd = balance_usd + $1
      WHERE telegram_id = $2
      `,
      [amount_usd, receiver_id]
    );

    await client.query(
      `
      UPDATE deals
      SET status = 'completed', completed_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    await ctx.editMessageText("💰 Deal completed. Receiver paid.");
  } catch (err) {
    await client.query("ROLLBACK");
    await ctx.reply("❌ Deal completion failed.");
  } finally {
    client.release();
  }
});

bot.action(/deal_accept_(\d+)/, async (ctx) => {
  const id = ctx.match[1];

  await pool.query(
    `UPDATE deals SET status = 'accepted' WHERE id = $1 AND status = 'pending'`,
    [id]
  );

  await ctx.editMessageText("✅ Deal accepted.");
});

bot.action("deal_pending", async (ctx) => {
  const telegramId = ctx.from.id;

  const res = await pool.query(
    `
    SELECT id, sender_id, receiver_id, amount_usd, description
    FROM deals
    WHERE status = 'pending'
      AND (sender_id = $1 OR receiver_id = $1)
    ORDER BY created_at DESC
    `,
    [telegramId]
  );

  if (!res.rows.length) {
    return ctx.editMessageText("⏳ <b>Pending Deals</b>\n\nNo pending deals.", {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        buttons.push([Markup.button.callback("⬅ Back", "deals")]),
      ]).reply_markup,
    });
  }

  const text =
    "⏳ <b>Pending Deals</b>\n\n" +
    res.rows
      .map((d) => {
        const role = d.sender_id === telegramId ? "You sent" : "You received";
        return (
          `<b>#${d.id}</b>\n` +
          `${role}\n` +
          `💵 $${d.amount_usd}\n` +
          `📝 ${d.description}`
        );
      })
      .join("\n\n");

  const buttons = res.rows
    .filter((d) => d.receiver_id === telegramId)
    .map((d) => [
      Markup.button.callback(`✅ Accept #${d.id}`, `deal_accept_${d.id}`),
    ]);

  buttons.push([Markup.button.callback("⬅ Back", "escrow")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
});
bot.action("deal_active", async (ctx) => {
  const telegramId = ctx.from.id;

  const res = await pool.query(
    `
    SELECT id, sender_id, receiver_id, amount_usd, description
    FROM deals
    WHERE status = 'accepted'
      AND (sender_id = $1 OR receiver_id = $1)
    ORDER BY created_at DESC
    `,
    [telegramId]
  );

  if (!res.rows.length) {
    return ctx.editMessageText("📦 <b>Active Deals</b>\n\nNo active deals.", {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "escrow")],
      ]).reply_markup,
    });
  }

  const text =
    "📦 <b>Active Deals</b>\n\n" +
    res.rows
      .map((d) => {
        const role = d.sender_id === telegramId ? "You sent" : "You received";
        return (
          `<b>#${d.id}</b>\n` +
          `${role}\n` +
          `💵 $${d.amount_usd}\n` +
          `📝 ${d.description}`
        );
      })
      .join("\n\n");

  const buttons = res.rows
    .filter((d) => d.sender_id === telegramId)
    .map((d) => [
      Markup.button.callback(`💰 Complete #${d.id}`, `deal_complete_${d.id}`),
    ]);

  buttons.push([Markup.button.callback("⬅ Back", "escrow")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
});

bot.action("deal_completed", async (ctx) => {
  const telegramId = ctx.from.id;

  const res = await pool.query(
    `
    SELECT id, sender_id, receiver_id, amount_usd, description, completed_at
    FROM deals
    WHERE status = 'completed'
      AND (sender_id = $1 OR receiver_id = $1)
    ORDER BY completed_at DESC
    LIMIT 20
    `,
    [telegramId]
  );

  if (!res.rows.length) {
    return ctx.editMessageText(
      "✅ <b>Completed Deals</b>\n\nNo completed deals.",
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("⬅ Back", "deals"),
        ]).reply_markup,
      }
    );
  }

  const text =
    "✅ <b>Completed Deals</b>\n\n" +
    res.rows
      .map((d) => {
        const role = d.sender_id === telegramId ? "You paid" : "You received";
        const date = new Date(d.completed_at).toLocaleDateString();
        return (
          `<b>#${d.id}</b>\n` +
          `${role}\n` +
          `💵 $${d.amount_usd}\n` +
          `📝 ${d.description}\n` +
          `📅 ${date}`
        );
      })
      .join("\n\n");

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback("⬅ Back", "escrow")],
    ]).reply_markup,
  });
});

bot.action("support", supportCommand);

bot.action("profile_transactions", profileTransactions);
bot.action(/tx_page_(\d+)/, profileTransactions);

bot.action("request_withdrawal", requestWithdrawal);

bot.action(/^withdraw_currency_(BTC|USDT)$/, async (ctx) => {
  const network = ctx.match[1];

  ctx.session.step = "withdraw_amount";
  ctx.session.network = network;

  await ctx.editMessageText(
    `💁 *Withdrawal*\n\nNetwork: *${network}*\n\nEnter amount in *USD*:`,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "request_withdrawal")],
      ]).reply_markup,
    }
  );
});

bot.action("community", (ctx) => {
  ctx.reply("🌐 Join our community:\nhttps://t.me/miles_Trader_support");
});

bot.action("main_menu", startCommand);

// ADMIN COMMANDS
bot.action("admin_menu", adminOnly, adminMenu);

bot.action("admin_shop_menu", adminOnly, adminShopMenu);
bot.action("admin_add_item", adminOnly, async (ctx) => {
  ctx.session = { step: "add_item_title" };
  await ctx.editMessageText("Enter item title:");
});

bot.action("admin_credit_menu", adminOnly, adminCreditMenu);
bot.action("admin_credit_address", adminOnly, adminCreditByAddressStart);

bot.action("admin_credit_approve", adminOnly, adminCreditApprove);
bot.action("admin_credit_reject", adminOnly, adminCreditReject);

bot.action("admin_find_user", adminOnly, adminFindUserStart);

bot.action("admin_credit_found_user", adminOnly, async (ctx) => {
  if (!ctx.session?.creditUserId) {
    return ctx.answerCbQuery("No user selected.");
  }

  ctx.session.step = "awaiting_amount";
  ctx.session.payoutCurrency = "MANUAL"; // 👈 IMPORTANT
  ctx.session.adminMessageId = ctx.callbackQuery.message.message_id;

  await ctx.editMessageText(
    "➕ *Credit User*\n\n" +
      "Source: *MANUAL*\n" +
      "Enter *USD amount* to credit:",
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("⬅ Back", "admin_menu")],
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

bot.command("admin_debit", adminOnly, adminDebit);
bot.action("admin_debit", adminOnly, async (ctx) => {
  ctx.session = { step: "admin_debit" };
  await ctx.editMessageText(
    "➖ <b>Admin Debit</b>\n\nSend:\n<code>telegram_id BTC|USDT amount reason</code>",
    { parse_mode: "HTML" }
  );
});

bot.on("message", async (ctx, next) => {
  if (!ctx.message?.text) return next();
  if (!ctx.session?.step) return next();

  /* =========================
     USER FLOWS (FIRST)
  ========================= */

  if (ctx.session.step === "shop_quantity") {
    return shopQuantityHandle(ctx);
  }

  if (ctx.session.step === "shop_confirm") {
    return shopConfirmHandle(ctx);
  }

  if (ctx.session.step === "shop_search") {
    return shopSearchHandle(ctx);
  }

  if (ctx.session.step === "withdraw_amount") {
    return withdrawAmountHandle(ctx);
  }

  if (ctx.session.step === "withdraw_address") {
    return withdrawAddressHandle(ctx);
  }

  /* 🤝 DEAL FLOWS */
  if (ctx.session.step === "deal_receiver") {
    return dealReceiver(ctx);
  }

  if (ctx.session.step === "deal_amount") {
    return dealAmount(ctx);
  }

  if (ctx.session.step === "deal_currency") {
    return dealCurrency(ctx);
  }

  if (ctx.session.step === "deal_desc") {
    return dealDesc(ctx);
  }

  /* =========================
     ADMIN FLOWS (LAST)
  ========================= */

  const adminSteps = [
    "add_item_title",
    "add_item_price",
    "add_item_currency",
    "add_item_stock",
    "awaiting_address",
    "awaiting_amount",
    "find_user",
    "admin_debit",
  ];

  if (adminSteps.includes(ctx.session.step)) {
    if (!ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply("⛔ Access denied.");
    }

    if (ctx.session.step === "add_item_title") return addItemTitle(ctx);
    if (ctx.session.step === "add_item_price") return addItemPrice(ctx);
    if (ctx.session.step === "add_item_stock") return addItemStock(ctx);

    if (ctx.session.step === "awaiting_address") return adminHandleAddress(ctx);
    if (ctx.session.step === "awaiting_amount") return adminHandleAmount(ctx);
    if (ctx.session.step === "find_user") return adminFindUserHandle(ctx);

    if (ctx.session.step === "admin_debit") return adminDebit(ctx);
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
