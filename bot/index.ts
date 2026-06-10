// Load environment variables FIRST
import dotenv from "dotenv"
dotenv.config()

import { Telegraf, Markup } from "telegraf"
import { message } from "telegraf/filters"
import { DatabaseService } from "./services/database"
import { AuthService } from "./services/auth"
import { PaymentService } from "./services/payment"
import { UserSession, BotContext } from "./types"

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBHOOK_DOMAIN = process.env.TELEGRAM_WEBHOOK_DOMAIN || ""
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coupx.in"

// Branding
const BRAND = "Hunt Coupon Store"

// Required Telegram channel — users must join before accessing the store.
// REQUIRES: the bot must be an ADMIN of this channel for getChatMember to work.
const REQUIRED_CHANNEL = process.env.REQUIRED_CHANNEL || "@Huntofficial24"
const REQUIRED_CHANNEL_URL =
  process.env.REQUIRED_CHANNEL_URL ||
  "https://t.me/" + REQUIRED_CHANNEL.replace(/^@/, "")

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required in .env file")
}

console.log(" Bot token loaded successfully")
console.log(" Site URL: " + SITE_URL)

// Initialize bot
const bot = new Telegraf<BotContext>(BOT_TOKEN)

// Session storage (in production, use Redis)
const sessions = new Map<number, UserSession>()

// Initialize services
const db = new DatabaseService()
const auth = new AuthService()
const payment = new PaymentService()

// Helper to get or create session
function getSession(userId: number): UserSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      isAuthenticated: false,
      awaitingInput: null,
    })
  }
  return sessions.get(userId)!
}

// Middleware to add session to context
bot.use((ctx, next) => {
  if (ctx.from) {
    ctx.session = getSession(ctx.from.id)
  }
  return next()
})

// ─────────────────────────────────────────────────────────────────────────────
// REPLY KEYBOARDS (stateful)
// MAIN screen   : coupon buttons + [👤 Profile] [💰 Balance] [📢 Get Updates]
// PROFILE screen: [📦 Recent Orders] [🔙 Back to Menu]
// BALANCE screen: [➕ Add Balance] [📋 Topup History] [🔙 Back to Menu]
// ─────────────────────────────────────────────────────────────────────────────

// Invisible zero-width marker prefixed to coupon buttons so the text router can
// distinguish a coupon tap from arbitrary text — the user never sees it, and the
// admin's own emoji/label on the coupon name shows exactly as entered.
const COUPON_MARKER = "⁣" // INVISIBLE SEPARATOR

// Fixed button labels
const BTN_PROFILE = "👤 Profile"
const BTN_BALANCE = "💰 Balance"
const BTN_UPDATES = "📢 Get Updates"
const BTN_RECENT_ORDERS = "📦 Recent Orders"
const BTN_ADD_BALANCE = "➕ Add Balance"
const BTN_TOPUP_HISTORY = "📋 Topup History"
const BTN_BACK = "🔙 Back to Menu"

const MAIN_BUTTONS = [BTN_PROFILE, BTN_BALANCE, BTN_UPDATES]

// MAIN keyboard: coupon buttons (invisible-marked) + the 3 fixed buttons.
function buildMainKeyboard(coupons: { name: string }[]) {
  const rows: string[][] = []
  for (let i = 0; i < coupons.length; i += 2) {
    const row = [COUPON_MARKER + coupons[i].name]
    if (coupons[i + 1]) row.push(COUPON_MARKER + coupons[i + 1].name)
    rows.push(row)
  }
  rows.push([BTN_PROFILE, BTN_BALANCE], [BTN_UPDATES])
  return Markup.keyboard(rows).resize().persistent()
}

async function mainKeyboard() {
  const coupons = await db.getAllAvailableCoupons()
  return buildMainKeyboard(coupons)
}

// PROFILE sub-screen keyboard
function profileKeyboard() {
  return Markup.keyboard([[BTN_RECENT_ORDERS], [BTN_BACK]]).resize().persistent()
}

// BALANCE sub-screen keyboard
function balanceKeyboard() {
  return Markup.keyboard([[BTN_ADD_BALANCE, BTN_TOPUP_HISTORY], [BTN_BACK]]).resize().persistent()
}

console.log(" Bot configured, registering commands...")

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL MEMBERSHIP GATE
// ─────────────────────────────────────────────────────────────────────────────

// Returns true if the user is a member of REQUIRED_CHANNEL.
async function isChannelMember(ctx: BotContext, telegramId: number): Promise<boolean> {
  try {
    const member = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, telegramId)
    return ["creator", "administrator", "member"].includes(member.status)
  } catch (error) {
    console.error("Error checking channel membership:", error)
    // If the check fails (e.g. bot not admin), fail-closed so the gate still applies.
    return false
  }
}

// Send the "please join the channel" prompt with the two inline buttons.
async function promptJoinChannel(ctx: BotContext, notJoinedYet = false) {
  const header = notJoinedYet
    ? `❌ *You haven't joined yet.*`
    : `🔒 *Welcome to ${BRAND}!*`
  await ctx.reply(
    `${header}\n\n` +
      `To access ${BRAND}, you must join our official channel first.\n\n` +
      `👉 Join ${REQUIRED_CHANNEL}, then tap *I've Joined*.`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url("📢 Join Channel", REQUIRED_CHANNEL_URL)],
        [Markup.button.callback("✅ I've Joined", "check_joined")],
      ]),
    }
  )
}

// ── Helper: ensure a user exists for this Telegram id (auto-create if new) ─────
// Always uses tg<telegramId>@hunt.com + a random password, and auto-links.
async function ensureUserForTelegram(
  ctx: BotContext,
  telegramId: number
): Promise<{ id: string; name: string; email: string; wallet_balance: number } | null> {
  // Already linked?
  const existing = await db.getUserByTelegramId(telegramId)
  if (existing) return existing

  // Auto-create a brand-new account keyed to the Telegram id.
  const email = `tg${telegramId}@hunt.com`
  const displayName = ctx.from?.first_name || ctx.from?.username || `User${telegramId}`

  const result = await auth.createAccount(email, displayName)
  if (!result.success || !result.userId) {
    console.error("Auto account creation failed:", result.error)
    return null
  }

  // Ensure the user_profile row exists (the Nhost trigger may lag).
  let profile = await db.getUserById(result.userId)
  if (!profile) {
    await db.createUserProfile(result.userId)
    profile = await db.getUserById(result.userId)
  }

  // Link the Telegram id so future /start logs them straight in.
  await db.linkTelegramAccount(result.userId, telegramId.toString())

  return profile
}

// ── Helper: show the welcome message + persistent coupon/menu keyboard ─────────
async function showWelcome(
  ctx: BotContext,
  user: { name: string; wallet_balance: number }
) {
  const keyboard = await mainKeyboard()
  await ctx.reply(
    `🎉 *Welcome${user.name ? ", " + user.name : ""}!*\n\n` +
      `💰 Balance: ₹${user.wallet_balance.toFixed(2)}\n\n` +
      `Tap a coupon below to buy, or use the menu.`,
    { parse_mode: "Markdown", ...keyboard }
  )
}

// ── Helper: open the buy flow for a coupon (pricing + quantity prompt) ────────
async function openCouponBuy(ctx: BotContext, couponId: string) {
  const session = ctx.session!
  const coupon = await db.getSlotWithPrice(couponId)

  if (!coupon || coupon.quantity === 0) {
    await ctx.reply("❌ Coupon not available.", await mainKeyboard())
    return
  }

  session.selectedCouponId = couponId
  session.selectedCouponName = coupon.name
  session.selectedCouponPricingTiers = coupon.pricing_tiers
  session.awaitingInput = "quantity"

  let pricingText = ""
  coupon.pricing_tiers.forEach((tier: any) => {
    const range = tier.max_quantity
      ? `${tier.min_quantity}-${tier.max_quantity}`
      : `${tier.min_quantity}+`
    const label = tier.label ? ` 🏷️ ${tier.label}` : ""
    pricingText += `📦 ${range} coupons → ₹${tier.unit_price}/coupon${label}\n`
  })

  await ctx.reply(
    `🎟️ *${coupon.name}*\n\n` +
      `${coupon.description ? `📝 ${coupon.description}\n\n` : ""}` +
      `💰 *Pricing Tiers:*\n${pricingText}\n` +
      `📦 Available Stock: ${coupon.quantity}\n\n` +
      `💬 *Enter the quantity you want:*\n_Type a number and send it_`,
    { parse_mode: "Markdown" }
  )
}

// COMMAND: /start
bot.command("start", async (ctx) => {
  const telegramId = ctx.from.id
  console.log(" /start command from user:", telegramId)

  try {
    // Check for deep link payload (e.g. /start paid_KARTAPK...)
    const payload = ctx.payload?.trim() || ""

    // ── Channel-membership gate ──────────────────────────────────────────────
    const joined = await isChannelMember(ctx, telegramId)
    if (!joined) {
      await promptJoinChannel(ctx)
      return
    }

    // ── Auto-login / auto-create by Telegram id ──────────────────────────────
    const user = await ensureUserForTelegram(ctx, telegramId)
    if (!user) {
      await ctx.reply("❌ Could not set up your account. Please try /start again.")
      return
    }

    {
      ctx.session!.isAuthenticated = true
      ctx.session!.userId = user.id
      ctx.session!.email = user.email

      const session = ctx.session!

      // Deep link payment return: /start paid_<orderId>
      const paymentPayload = payload.startsWith("paid_") ? payload.slice(5) : null

      // SECURITY: only process if the order ID matches THIS user's own pending order in session.
      // Prevents anyone crafting a fake ?start=paid_<orderId> link to trigger a payment check.
      const pendingOrderId = paymentPayload
        ? (paymentPayload === session.pendingOrderId ? paymentPayload : null)
        : session.pendingOrderId

      if (
        pendingOrderId &&
        session.pendingPaymentMessageId &&
        session.pendingPaymentChatId
      ) {
        const msgId = session.pendingPaymentMessageId
        const pendingChatId = session.pendingPaymentChatId
        const staticMsgId = session.pendingStaticMessageId

        // Stop the countdown timer immediately
        if (session.pendingBalanceTimer) {
          clearInterval(session.pendingBalanceTimer)
          session.pendingBalanceTimer = undefined
        }
        session.pendingOrderId = undefined
        session.pendingPaymentMessageId = undefined
        session.pendingPaymentChatId = undefined
        session.pendingStaticMessageId = undefined

        try {
          const statusResult = await payment.checkPaymentStatus(pendingOrderId)
          if (statusResult.success && statusResult.status === "success") {
            const updatedUser = await db.getUserById(user.id)
            const newBalance = updatedUser?.wallet_balance ?? user.wallet_balance

            // Delete the static "Pay Here" message
            if (staticMsgId) {
              try { await ctx.telegram.deleteMessage(pendingChatId, staticMsgId) } catch {}
            }

            // Edit timer message → success
            try {
              await ctx.telegram.editMessageText(
                pendingChatId,
                msgId,
                undefined,
                `✅ *Payment Successful!*\n\n` +
                  `₹${session.pendingBalanceAmount ?? ""} has been added to your wallet.\n` +
                  (statusResult.utr ? `🔖 UTR: \`${statusResult.utr}\`\n` : "") +
                  `💰 New Balance: *₹${newBalance.toFixed(2)}*`,
                {
                  parse_mode: "Markdown",
                }
              )
            } catch {}
          }
        } catch {}
      }

      await showWelcome(ctx, user)
    }
  } catch (error: any) {
    console.error(" Error in /start:", error)
    await ctx.reply(" An error occurred. Please try again later.")
  }
})

console.log(" /start command registered")

// ── CALLBACK: check_joined — re-check channel membership ─────────────────────
bot.action("check_joined", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const telegramId = ctx.from!.id
    const joined = await isChannelMember(ctx, telegramId)

    if (!joined) {
      // Still not joined — show the prompt again.
      try { await ctx.deleteMessage() } catch {}
      await promptJoinChannel(ctx, true)
      return
    }

    // Joined — set up the account and show the welcome.
    try { await ctx.deleteMessage() } catch {}
    const user = await ensureUserForTelegram(ctx, telegramId)
    if (!user) {
      await ctx.reply("❌ Could not set up your account. Please try /start again.")
      return
    }
    ctx.session!.isAuthenticated = true
    ctx.session!.userId = user.id
    ctx.session!.email = user.email
    await showWelcome(ctx, user)
  } catch (error: any) {
    console.error("Error in check_joined:", error)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH FLOW
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: legacy email/password auth callbacks (register_new, found_login,
// found_other, credentials_saved, register_existing, link_account_yes/no) and
// the back_to_menu / back_to_menu_keep callbacks were removed. Auth is now fully
// automatic via Telegram id, and the persistent keyboard replaces "Back to Menu".

// NOTE: store_{id}, show_stores and coupon_{id} callbacks removed. Coupons are
// now shown directly as reply-keyboard buttons; tapping one calls openCouponBuy().

// CALLBACK: cancel — dismiss an in-chat prompt (replaces the old back_to_menu).
// The persistent reply keyboard stays visible, so there's no menu to return to.
bot.action("cancel", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    if (ctx.session) {
      ctx.session.awaitingInput = undefined
      if (ctx.session.pendingBalanceTimer) {
        clearInterval(ctx.session.pendingBalanceTimer)
        ctx.session.pendingBalanceTimer = undefined
      }
    }
    try { await ctx.deleteMessage() } catch {}
  } catch (error: any) {
    console.error("Error in cancel:", error)
  }
})

bot.action("confirm_buy", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!

    await ctx.editMessageText("🔄 Processing purchase...")

    // Calculate unit price from total
    const unitPrice = session.calculatedPrice! / session.purchaseQuantity!

    // Create purchase
    const purchase = await db.createPurchase(
      session.userId!,
      session.selectedCouponId!,
      session.purchaseQuantity!,
      unitPrice
    )

    if (!purchase || !purchase.coupon_codes || purchase.coupon_codes.length === 0) {
      await ctx.editMessageText("❌ Purchase failed. Please try again or contact support.")
      return
    }

    // Format coupon codes (limit to first 100 for display)
    const totalCodes = purchase.coupon_codes.length
    const codesToShow = purchase.coupon_codes.slice(0, 100)
    const codesList = codesToShow
      .map((code: string, i: number) => `${i + 1}. \`${code}\``)
      .join("\n")
    
    const moreCodesNote = totalCodes > 100 
      ? `\n\n_... and ${totalCodes - 100} more codes.\nDownload as TXT/CSV to see all codes._`
      : ""

    await ctx.editMessageText(
      `✅ *Purchase Successful!*\n\n` +
        `🎟️ ${session.selectedCouponName}\n` +
        `📦 Quantity: ${session.purchaseQuantity}\n` +
        `💵 Total Paid: ₹${purchase.total_price.toFixed(2)}\n\n` +
        `*Your Coupon Codes:*\n${codesList}${moreCodesNote}\n\n` +
        `_Tap to copy each code_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("📄 Get as TXT", `download_txt_${purchase.id}`),
            Markup.button.callback("📊 Get as CSV", `download_csv_${purchase.id}`),
          ],
        ]),
      }
    )

    // Refresh the persistent keyboard (stock may have changed).
    await ctx.reply("✅ Done! Tap another coupon or use the menu.", await mainKeyboard())

    // Clear session
    session.selectedStoreId = undefined
    session.selectedCouponId = undefined
    session.selectedCouponName = undefined
    session.purchaseQuantity = undefined
    session.calculatedPrice = undefined
  } catch (error: any) {
    console.error(" Error in confirm_buy:", error)
    await ctx.reply("❌ An error occurred during purchase. Please contact support.")
  }
})

// CALLBACK: download_txt_{purchaseId} - Send codes as TXT file
bot.action(/^download_txt_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery("Generating TXT file...")
    const purchaseId = ctx.match[1]
    const purchase = await db.getPurchaseDetails(purchaseId)

    if (!purchase || !purchase.coupon_codes) {
      await ctx.reply("Failed to generate file.")
      return
    }

    const txtContent = purchase.coupon_codes.join("\n")

    // Delete the button message
    await ctx.deleteMessage()

    // Send the file
    await ctx.replyWithDocument(
      {
        source: Buffer.from(txtContent),
        filename: `coupx_${purchase.slot.name.replace(/\s+/g, "_")}_${Date.now()}.txt`,
      },
      { caption: "📄 Your coupon codes" }
    )

    // Refresh the persistent menu
    await ctx.reply("Choose an option:", await mainKeyboard())
  } catch (error: any) {
    console.error(" Error in download_txt:", error)
  }
})

// CALLBACK: download_csv_{purchaseId} - Send codes as CSV file
bot.action(/^download_csv_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery("Generating CSV file...")
    const purchaseId = ctx.match[1]
    const purchase = await db.getPurchaseDetails(purchaseId)

    if (!purchase || !purchase.coupon_codes) {
      await ctx.reply("Failed to generate file.")
      return
    }

    const csvContent = "Code\n" + purchase.coupon_codes.join("\n")

    // Delete the button message
    await ctx.deleteMessage()

    // Send the file
    await ctx.replyWithDocument(
      {
        source: Buffer.from(csvContent),
        filename: `coupx_${purchase.slot.name.replace(/\s+/g, "_")}_${Date.now()}.csv`,
      },
      { caption: "📊 Your coupon codes" }
    )

    // Refresh the persistent menu
    await ctx.reply("Choose an option:", await mainKeyboard())
  } catch (error: any) {
    console.error(" Error in download_csv:", error)
  }
})

// CALLBACK: purchase_{id} - Show purchase details
bot.action(/^purchase_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const purchaseId = ctx.match[1]
    const purchase = await db.getPurchaseDetails(purchaseId)

    if (!purchase) {
      await ctx.reply("Purchase not found.")
      return
    }

    const codes = purchase.coupon_codes || []
    const totalCodes = codes.length
    const codesToShow = codes.slice(0, 100)
    const codesList = codesToShow.map((code: string, i: number) => `${i + 1}. \`${code}\``).join("\n")
    
    const moreCodesNote = totalCodes > 100 
      ? `\n\n_... and ${totalCodes - 100} more codes.\nDownload as TXT/CSV to see all codes._`
      : ""

    const date = new Date(purchase.created_at)
    const formattedDate = date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    await ctx.editMessageText(
      `📦 *Purchase Details*\n\n` +
        `🏪 Store: ${purchase.slot.store?.name}\n` +
        `🎟️ Coupon: ${purchase.slot.name}\n` +
        `📦 Quantity: ${purchase.quantity}\n` +
        `💵 Total Price: ₹${purchase.total_price.toFixed(2)}\n` +
        `📅 Date: ${formattedDate}\n` +
        `🆔 Order ID: \`${purchase.order_number || purchase.id}\`\n\n` +
        `*Coupon Codes:*\n${codesList}${moreCodesNote}\n\n` +
        `_Tap to copy each code_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("📄 Get as TXT", `download_txt_${purchase.id}`),
            Markup.button.callback("📊 Get as CSV", `download_csv_${purchase.id}`),
          ],
          [Markup.button.callback("🔙 Back to Purchases", "show_purchases")],
        ]),
      }
    )
  } catch (error: any) {
    console.error(" Error in purchase callback:", error)
  }
})

// CALLBACK: show_purchases - Show recent purchases list
bot.action("show_purchases", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const purchases = await db.getUserPurchases(ctx.session!.userId!, 10)

    if (purchases.length === 0) {
      await ctx.editMessageText("No purchases found.")
      return
    }

    const buttons = purchases.map((purchase: any) => [
      Markup.button.callback(
        `${purchase.slot.store?.name || "Store"} - ${purchase.slot.name} - ₹${purchase.total_price}`,
        `purchase_${purchase.id}`
      ),
    ])

    await ctx.editMessageText("📦 *Your Recent Orders:*", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    })
  } catch (error: any) {
    console.error(" Error in show_purchases:", error)
  }
})

// NOTE: add_balance, topup_history, unlink_account, delete_account, show_profile,
// edit_name, edit_email, change_password, reset_password callbacks were removed.
// Add Balance / Topup History are now reply-keyboard buttons; account-management
// actions were dropped per spec.

// TEXT MESSAGE HANDLER - For email/password input
bot.on(message("text"), async (ctx) => {
  const session = ctx.session!
  const text = ctx.message.text

  // Skip if it's a command
  if (text.startsWith("/")) return

  // Menu/sub-screen buttons and coupon buttons ALWAYS take priority over any
  // pending input state. Without this, tapping one while awaitingInput ===
  // "add_balance_amount" would be treated as an invalid balance amount.
  const ALL_NAV_BUTTONS = [
    ...MAIN_BUTTONS, BTN_RECENT_ORDERS, BTN_ADD_BALANCE, BTN_TOPUP_HISTORY, BTN_BACK,
  ]
  const isMenuTap = ALL_NAV_BUTTONS.includes(text) || text.includes(COUPON_MARKER)
  if (session.isAuthenticated && isMenuTap) {
    // Cancel any running payment timer
    if (session.pendingBalanceTimer) {
      clearInterval(session.pendingBalanceTimer)
      session.pendingBalanceTimer = undefined
    }
    session.awaitingInput = undefined
  }

  try {
    // Handle quantity input for coupon purchase
    if (session.awaitingInput === "quantity") {
      const quantity = parseInt(text.trim())

      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply("❌ Please enter a valid positive number.")
        return
      }

      const coupon = await db.getSlotWithPrice(session.selectedCouponId!)

      if (!coupon || !coupon.pricing_tiers || coupon.pricing_tiers.length === 0) {
        await ctx.reply("❌ Pricing information not available. Please try again.")
        session.awaitingInput = null
        return
      }

      if (quantity > coupon.quantity) {
        await ctx.reply(`❌ Only ${coupon.quantity} coupons available. Please enter a smaller quantity.`)
        return
      }

      // Find the correct pricing tier for this quantity
      const applicableTier = coupon.pricing_tiers.find((tier: any) => {
        const inRange = quantity >= tier.min_quantity
        const noMax = tier.max_quantity === null
        const underMax = tier.max_quantity && quantity <= tier.max_quantity
        return inRange && (noMax || underMax)
      })

      if (!applicableTier) {
        await ctx.reply("❌ No pricing available for this quantity. Please try a different amount.")
        return
      }

      const unitPrice = parseFloat(applicableTier.unit_price)
      const totalPrice = unitPrice * quantity
      const user = await db.getUserById(session.userId!)

      if (!user || user.wallet_balance < totalPrice) {
        await ctx.reply(
          `❌ *Insufficient Balance*\n\n` +
            `💵 Total: ₹${totalPrice.toFixed(2)}\n` +
            `💰 Your Balance: ₹${user?.wallet_balance.toFixed(2) || "0.00"}\n\n` +
            `Tap *➕ Add Balance* from the menu below to top up, then try again.`,
          { parse_mode: "Markdown" }
        )
        session.awaitingInput = null
        return
      }

      // Store calculation for confirmation
      session.purchaseQuantity = quantity
      session.calculatedPrice = totalPrice
      session.awaitingInput = null

      await ctx.reply(
        `🛒 *Confirm Purchase*\n\n` +
          `🎟️ Coupon: ${session.selectedCouponName}\n` +
          `📦 Quantity: ${quantity}\n` +
          `💰 Price per coupon: ₹${unitPrice.toFixed(2)}\n` +
          `💵 Total: ₹${totalPrice.toFixed(2)}\n\n` +
          `💳 Current Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
          `💰 After Purchase: ₹${(user.wallet_balance - totalPrice).toFixed(2)}\n\n` +
          `Are you sure you want to proceed?`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Confirm & Buy", "confirm_buy")],
            [Markup.button.callback("🔙 Cancel", "cancel")],
          ]),
        }
      )
    }
    // Handle add balance amount input
    else if (session.awaitingInput === "add_balance_amount") {
      const amountText = text.trim()
      const amount = parseFloat(amountText)

      if (isNaN(amount) || amount < 1 || amount > 10000 || !/^\d+(\.\d{1,2})?$/.test(amountText)) {
        await ctx.reply(
          `❌ *Invalid amount*\n\nPlease enter a valid amount between ₹1 and ₹10,000.\n\n_Example: 100 or 250.50_`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "cancel")]]),
          }
        )
        return
      }

      session.awaitingInput = null
      session.pendingBalanceAmount = amount

      const loadingMsg = await ctx.reply(`⏳ Creating payment order for ₹${amount}...`)

      try {
        const user = await db.getUserById(session.userId!)
        if (!user) {
          await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id)
          await ctx.reply("❌ User not found. Please try again.")
          return
        }

        const result = await payment.createPaymentOrder(
          session.userId!,
          amount,
          "9999999999", // placeholder mobile - IMB needs it but wallet credit uses order_id
          user.email
        )

        await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id)

        if (!result.success || !result.data) {
          await ctx.reply(
            `❌ *Failed to create payment order*\n\n${result.error || "Please try again."}\n\nIf this keeps happening, use the website to add balance.`,
            {
              parse_mode: "Markdown",
              ...Markup.inlineKeyboard([
                [Markup.button.url("🌐 Add Balance on Website", `${SITE_URL}/add-balance`)],
              ]),
            }
          )
          return
        }

        session.pendingOrderId = result.data.orderId

        const PAYMENT_TIMEOUT_SECS = 300
        let remainingSeconds = PAYMENT_TIMEOUT_SECS
        const chatId = ctx.chat!.id
        const userId = session.userId!
        const { orderId, paymentUrl } = result.data

        // Clear any pre-existing timer
        if (session.pendingBalanceTimer) {
          clearInterval(session.pendingBalanceTimer)
          session.pendingBalanceTimer = undefined
        }

        // MESSAGE 1: Static payment info with URL (never edited, deleted on success)
        const staticMsg = await ctx.reply(
          `💳 *Payment Order Created!*\n\n` +
            `Amount: *₹${amount}*\n` +
            `Order ID: \`${orderId}\`\n\n` +
            `👇 Tap the link below to pay:\n` +
            `${paymentUrl}`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.url("💳 Pay Here", paymentUrl)],
            ]),
          }
        )

        // MESSAGE 2: Live timer (edited every 3s — safe within Telegram rate limits)
        const timerMsg = await ctx.reply(
          `⏱ *Time remaining: 5:00*\n_Waiting for payment..._`,
          { parse_mode: "Markdown" }
        )

        session.pendingPaymentMessageId = timerMsg.message_id
        session.pendingPaymentChatId = chatId
        session.pendingStaticMessageId = staticMsg.message_id

        const formatCountdown = (secs: number) => {
          const m = Math.floor(secs / 60)
          const s = secs % 60
          return `${m}:${s.toString().padStart(2, "0")}`
        }

        // Runs every 1 second. Edits Telegram every 3s. Polls payment every 30s.
        session.pendingBalanceTimer = setInterval(async () => {
          remainingSeconds -= 1

          // --- payment poll every 30s ---
          if (remainingSeconds > 0 && remainingSeconds % 30 === 0) {
            try {
              const statusResult = await payment.checkPaymentStatus(orderId)
              if (statusResult.success && statusResult.status === "success") {
                clearInterval(session.pendingBalanceTimer!)
                session.pendingBalanceTimer = undefined
                session.pendingOrderId = undefined
                session.pendingPaymentMessageId = undefined
                session.pendingPaymentChatId = undefined
                const staticMsgId = session.pendingStaticMessageId
                session.pendingStaticMessageId = undefined

                const updatedUser = await db.getUserById(userId)
                const newBalance = updatedUser?.wallet_balance ?? amount

                if (staticMsgId) {
                  try { await bot.telegram.deleteMessage(chatId, staticMsgId) } catch {}
                }
                try {
                  await bot.telegram.editMessageText(
                    chatId,
                    timerMsg.message_id,
                    undefined,
                    `✅ *Payment Successful!*\n\n` +
                      `₹${amount} has been added to your wallet.\n` +
                      (statusResult.utr ? `🔖 UTR: \`${statusResult.utr}\`\n` : "") +
                      `💰 New Balance: *₹${newBalance.toFixed(2)}*`,
                    { parse_mode: "Markdown" }
                  )
                } catch {}
                return
              }
            } catch {}
          }

          // --- timer expired ---
          if (remainingSeconds <= 0) {
            clearInterval(session.pendingBalanceTimer!)
            session.pendingBalanceTimer = undefined
            session.pendingOrderId = undefined
            session.pendingPaymentMessageId = undefined
            session.pendingPaymentChatId = undefined
            try {
              await bot.telegram.editMessageText(
                chatId,
                timerMsg.message_id,
                undefined,
                `⏰ *Payment Session Expired*\n\n` +
                  `Your payment link has expired.\n` +
                  `Tap *➕ Add Balance* from the menu to create a new payment.`,
                { parse_mode: "Markdown" }
              )
            } catch {}
            return
          }

          // --- update display every 3s (Telegram rate limit: ~1 edit/3s) ---
          if (remainingSeconds % 3 === 0) {
            try {
              await bot.telegram.editMessageText(
                chatId,
                timerMsg.message_id,
                undefined,
                `⏱ *Time remaining: ${formatCountdown(remainingSeconds)}*\n_Waiting for payment..._`,
                { parse_mode: "Markdown" }
              )
            } catch {}
          }
        }, 1000)
      } catch (err: any) {
        console.error(" Error creating payment order:", err)
        try { await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id) } catch {}
        await ctx.reply(
          `❌ *Payment Error*\n\nSomething went wrong. Please try again later or add balance on the website.`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.url("🌐 Add Balance on Website", `${SITE_URL}/add-balance`)],
            ]),
          }
        )
      }
    }
    // Handle navigation buttons (main + sub-screens)
    else if (session.isAuthenticated) {
      // ── COUPON TAP (invisible-marked reply button) ─────────────────────────
      if (text.includes(COUPON_MARKER)) {
        session.awaitingInput = undefined
        // Strip every marker char (in case Telegram preserves it anywhere).
        const couponName = text.split(COUPON_MARKER).join("").trim()

        const coupons = await db.getAllAvailableCoupons()
        const coupon = coupons.find((c: any) => c.name === couponName)
        if (!coupon) {
          await ctx.reply("❌ That coupon is no longer available.", await mainKeyboard())
          return
        }
        // Out-of-stock: still listed, but tapping just informs the user.
        if (!coupon.quantity || coupon.quantity <= 0) {
          await ctx.reply(
            `😔 *${coupon.name}* is currently *out of stock*.\n\nCheck back soon — we restock regularly!`,
            { parse_mode: "Markdown" }
          )
          return
        }
        await openCouponBuy(ctx, coupon.id)
      }
      // ── BACK TO MENU → restore the main keyboard ───────────────────────────
      else if (text === BTN_BACK) {
        session.awaitingInput = undefined
        await ctx.reply("🏠 Main menu", await mainKeyboard())
      }
      // ── PROFILE → switch to the Profile sub-screen ─────────────────────────
      else if (text === BTN_PROFILE) {
        session.awaitingInput = undefined
        const user = await db.getUserById(session.userId!)
        const stats = await db.getUserStats(session.userId!)
        if (user) {
          await ctx.reply(
            `👤 *Your ${BRAND} Profile*\n\n` +
              `👨 Name: ${user.name}\n` +
              `💰 Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
              `🎟️ Total Coupons Bought: ${stats.totalCouponsBought}`,
            { parse_mode: "Markdown", ...profileKeyboard() }
          )
        }
      }
      // ── BALANCE → switch to the Balance sub-screen ─────────────────────────
      else if (text === BTN_BALANCE) {
        session.awaitingInput = undefined
        const user = await db.getUserById(session.userId!)
        if (user) {
          await ctx.reply(
            `💰 *Your Wallet*\n\n` +
              `💵 Current Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
              `🛍️ Total Spent: ₹${(user.total_spent || 0).toFixed(2)}`,
            { parse_mode: "Markdown", ...balanceKeyboard() }
          )
        }
      }
      // ── RECENT ORDERS (Profile sub-screen) ─────────────────────────────────
      else if (text === BTN_RECENT_ORDERS) {
        session.awaitingInput = undefined
        const purchases = await db.getUserPurchases(session.userId!, 10)
        if (purchases.length === 0) {
          await ctx.reply(
            "📦 *Recent Orders*\n\nYou haven't made any purchases yet.\nTap a coupon from the menu to get started!",
            { parse_mode: "Markdown" }
          )
          return
        }

        const buttons = purchases.map((purchase: any) => [
          Markup.button.callback(
            `${purchase.slot.store?.name || "Store"} - ${purchase.slot.name} - ₹${purchase.total_price}`,
            `purchase_${purchase.id}`
          ),
        ])

        await ctx.reply("📦 *Your Recent Orders:*", { parse_mode: "Markdown" })
        await ctx.reply("Select an order:", Markup.inlineKeyboard(buttons))
      }
      // ── ADD BALANCE (Balance sub-screen) ───────────────────────────────────
      else if (text === BTN_ADD_BALANCE) {
        session.awaitingInput = "add_balance_amount"
        await ctx.reply(
          `💰 *Add Balance*\n\n` +
            `Enter the amount you want to add to your wallet:\n\n` +
            `• Minimum: ₹1\n` +
            `• Maximum: ₹10,000\n\n` +
            `_Type the amount and press send (e.g. 100)_`,
          { parse_mode: "Markdown" }
        )
      }
      // ── TOPUP HISTORY (Balance sub-screen) ─────────────────────────────────
      else if (text === BTN_TOPUP_HISTORY) {
        session.awaitingInput = undefined
        const topups = await db.getTopupHistory(session.userId!, 10)
        if (topups.length === 0) {
          await ctx.reply("📋 *Topup History*\n\nNo topup transactions found.\nAdd balance to get started!", {
            parse_mode: "Markdown",
          })
          return
        }
        const statusEmoji: Record<string, string> = { success: "✅", pending: "⏳", failed: "❌" }
        const historyLines = topups.map((t: any) => {
          const emoji = statusEmoji[t.status] || "🔄"
          const date = new Date(t.created_at).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          })
          return `${emoji} ₹${Number(t.amount).toFixed(2)} — ${t.status.toUpperCase()} — ${date}`
        })
        await ctx.reply(`📋 *Topup History* _(last 10)_\n\n${historyLines.join("\n")}`, {
          parse_mode: "Markdown",
        })
      }
      // ── GET UPDATES → channel link ─────────────────────────────────────────
      else if (text === BTN_UPDATES) {
        session.awaitingInput = undefined
        await ctx.reply(
          `📢 *Join Our Official Channel!*\n\n` +
            `Stay updated with:\n` +
            `✅ New coupon releases\n` +
            `✅ Exclusive discounts\n` +
            `✅ Flash sales & offers\n` +
            `✅ Platform updates\n\n` +
            `👉 ${REQUIRED_CHANNEL_URL}`,
          { parse_mode: "Markdown" }
        )
      }
    }
  } catch (error: any) {
    console.error(" Error in text handler:", error)
    await ctx.reply("❌ An error occurred. Please try /start again.")
  }
})

console.log(" All handlers registered")

// Start bot
async function startBot() {
  console.log(` ${BRAND} Telegram Bot starting...`)

  if (WEBHOOK_DOMAIN) {
    // Production mode: Use webhooks with Express server
    const express = await import("express")
    const app = express.default()
    
    const webhookPath = "/telegram-webhook/" + BOT_TOKEN
    const PORT = process.env.PORT || 3001

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", mode: "webhook" })
    })

    // Webhook endpoint
    app.use(await bot.createWebhook({ domain: WEBHOOK_DOMAIN, path: webhookPath }))

    // Start server
    app.listen(PORT, async () => {
      console.log(` Webhook server running on port ${PORT}`)
      console.log(` Webhook URL: ${WEBHOOK_DOMAIN}${webhookPath}`)
      console.log(` Health check: http://localhost:${PORT}/health`)
    })
  } else {
    // Development mode: Use polling
    await bot.launch()
    console.log(" Bot started with polling mode")
    console.log(" Bot is ready! Send /start to test")
  }

  process.once("SIGINT", () => bot.stop("SIGINT"))
  process.once("SIGTERM", () => bot.stop("SIGTERM"))
}

startBot().catch((err) => {
  console.error(" Failed to start bot:", err)
  process.exit(1)
})

export default bot
