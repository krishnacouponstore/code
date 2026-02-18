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

// Main menu keyboard
const mainMenuKeyboard = Markup.keyboard([
  ["🎟️ Coupons", "📢 CoupX Updates"],
  ["💰 Balance", "📦 Recent Purchases"],
  ["👤 CoupX Profile", "❓ Help"],
])
  .resize()
  .persistent()

console.log(" Bot configured, registering commands...")

// COMMAND: /start
bot.command("start", async (ctx) => {
  const telegramId = ctx.from.id
  console.log(" /start command from user:", telegramId)

  try {
    // Check for deep link payload (e.g. /start paid_COUPXBOT...)
    const payload = ctx.payload?.trim() || ""

    const user = await db.getUserByTelegramId(telegramId)

    if (user) {
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
                  ...Markup.inlineKeyboard([
                    [Markup.button.callback("🏠 Back to Menu", "back_to_menu_keep")],
                  ]),
                }
              )
            } catch {}
          }
        } catch {}
      }

      await ctx.reply(
        " *Welcome back, " + user.name + "!*\n\n Balance: " + user.wallet_balance.toFixed(2) + "\n\nChoose an option from the menu below:",
        { parse_mode: "Markdown", ...mainMenuKeyboard }
      )
    } else {
      await ctx.reply(
        " *Welcome to CoupX!*\n\nAre you a new user or do you already have a CoupX account?",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback(" New CoupX User", "register_new")],
            [Markup.button.callback(" Existing CoupX User", "register_existing")],
          ]),
        }
      )
    }
  } catch (error: any) {
    console.error(" Error in /start:", error)
    await ctx.reply(" An error occurred. Please try again later.")
  }
})

console.log(" /start command registered")

// CALLBACK: register_new - Create new account
bot.action("register_new", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const telegramId = ctx.from.id
    const username = ctx.from.username || `user${telegramId}`
    const primaryEmail = `${username}@yopmail.com`
    const secondaryEmail = `${username}-2@yopmail.com`

    console.log("🆕 Checking accounts for:", username)

    // Check both possible emails
    const existingPrimary = await db.getUserByEmail(primaryEmail)
    const existingSecondary = await db.getUserByEmail(secondaryEmail)

    // If primary email exists
    if (existingPrimary) {
      // Check if it's linked to a different telegram account
      if (existingPrimary.telegram_id && existingPrimary.telegram_id !== telegramId.toString()) {
        await ctx.editMessageText(
          `⚠️ *Account Already Linked*\n\n` +
            `An account with email \`${primaryEmail}\` exists and is linked to a different Telegram account.\n\n` +
            `If this is your account, please unlink it first from that Telegram account.`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_to_menu")]]),
          }
        )
        return
      }

      // Account exists and is unlinked or was created by this telegram - show options
      ctx.session!.tempExistingUserId = existingPrimary.id
      ctx.session!.tempExistingEmail = existingPrimary.email

      await ctx.editMessageText(
        `🔍 *Existing Account Found*\n\n` +
          `We found an account that was previously created from this Telegram:\n` +
          `📧 Email: \`${primaryEmail}\`\n` +
          `💰 Balance: ₹${existingPrimary.wallet_balance.toFixed(2)}\n\n` +
          `What would you like to do?`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Use This Account", "use_existing_account")],
            [Markup.button.callback("🆕 Create New Account", "create_secondary_account")],
            [Markup.button.callback("🔑 Login to Different Account", "register_existing")],
          ]),
        }
      )
      return
    }

    // Primary doesn't exist, create it directly
    const result = await auth.createAccount(primaryEmail, ctx.from.first_name || username, telegramId.toString())

    if (result.success && result.credentials) {
      const { email: createdEmail, password } = result.credentials
      const { userId } = result

      ctx.session!.isAuthenticated = true
      ctx.session!.userId = userId
      ctx.session!.email = createdEmail

      await ctx.editMessageText(
        `✅ *Account Created Successfully!*\n\n` +
          `📧 Email: \`${createdEmail}\`\n` +
          `🔑 Password: \`${password}\`\n\n` +
          `⚠️ *IMPORTANT:* Save these credentials! You'll need them to login on ${SITE_URL}\n\n` +
          `Have you saved your credentials?`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("✅ Yes, I've Saved Them", "credentials_saved")]]),
        }
      )
    } else {
      await ctx.editMessageText(
        `❌ Failed to create account: ${result.error}\n\nPlease try again or contact support.`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🔄 Try Again", "register_new")]]),
        }
      )
    }
  } catch (error: any) {
    console.error("⚠️ Error in register_new:", error)
    await ctx.reply("❌ An error occurred. Please try /start again.")
  }
})

// CALLBACK: use_existing_account - Re-link existing account
bot.action("use_existing_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const telegramId = ctx.from.id
    const userId = ctx.session!.tempExistingUserId
    const email = ctx.session!.tempExistingEmail

    const linkSuccess = await db.linkTelegramAccount(userId!, telegramId.toString())

    if (linkSuccess) {
      const user = await db.getUserById(userId!)

      ctx.session!.isAuthenticated = true
      ctx.session!.userId = userId
      ctx.session!.email = email
      delete ctx.session!.tempExistingUserId
      delete ctx.session!.tempExistingEmail
      delete ctx.session!.tempSecondaryUserId
      delete ctx.session!.tempSecondaryEmail

      await ctx.editMessageText(
        `✅ *Account Re-linked Successfully!*\n\n` +
          `📧 Email: \`${email!}\`\n` +
          `💰 Balance: ₹${user?.wallet_balance.toFixed(2) || '0.00'}\n\n` +
          `Your existing CoupX account has been linked to this Telegram account.\n\n` +
          `You can now access all your previous purchases and balance!`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🏠 Continue to Menu", "credentials_saved")]]),
        }
      )
    } else {
      await ctx.editMessageText("❌ Failed to link account. Please try again.", {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🔄 Try Again", "register_new")]]),
      })
    }
  } catch (error: any) {
    console.error("⚠️ Error in use_existing_account:", error)
    await ctx.reply("❌ An error occurred.")
  }
})

// CALLBACK: use_secondary_account - Re-link secondary account
bot.action("use_secondary_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const telegramId = ctx.from.id
    const userId = ctx.session!.tempSecondaryUserId
    const email = ctx.session!.tempSecondaryEmail

    const linkSuccess = await db.linkTelegramAccount(userId!, telegramId.toString())

    if (linkSuccess) {
      const user = await db.getUserById(userId!)

      ctx.session!.isAuthenticated = true
      ctx.session!.userId = userId
      ctx.session!.email = email
      delete ctx.session!.tempExistingUserId
      delete ctx.session!.tempExistingEmail
      delete ctx.session!.tempSecondaryUserId
      delete ctx.session!.tempSecondaryEmail

      await ctx.editMessageText(
        `✅ *Account Re-linked Successfully!*\n\n` +
          `📧 Email: \`${email!}\`\n` +
          `💰 Balance: ₹${user?.wallet_balance.toFixed(2) || '0.00'}\n\n` +
          `Your second CoupX account has been linked to this Telegram account.\n\n` +
          `You can now access all your previous purchases and balance!`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🏠 Continue to Menu", "credentials_saved")]]),
        }
      )
    } else {
      await ctx.editMessageText("❌ Failed to link account. Please try again.", {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🔄 Try Again", "register_new")]]),
      })
    }
  } catch (error: any) {
    console.error("⚠️ Error in use_secondary_account:", error)
    await ctx.reply("❌ An error occurred.")
  }
})

// CALLBACK: create_secondary_account - Create second account
bot.action("create_secondary_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const telegramId = ctx.from.id
    const username = ctx.from.username || `user${telegramId}`
    const secondaryEmail = `${username}-2@yopmail.com`

    // Check if secondary account already exists
    const existingSecondary = await db.getUserByEmail(secondaryEmail)

    if (existingSecondary) {
      const existingSecondaryUser = await db.getUserById(existingSecondary.id)
      
      // Store secondary account info in session too
      ctx.session!.tempSecondaryUserId = existingSecondary.id
      ctx.session!.tempSecondaryEmail = existingSecondary.email
      
      await ctx.editMessageText(
        `⚠️ *Account Limit Reached*\n\n` +
          `You already have 2 accounts created from this Telegram:\n\n` +
          `1️⃣ \`${ctx.session!.tempExistingEmail!}\` - Balance: ₹${(await db.getUserById(ctx.session!.tempExistingUserId!))?.wallet_balance.toFixed(2) || '0.00'}\n` +
          `2️⃣ \`${secondaryEmail}\` - Balance: ₹${existingSecondaryUser?.wallet_balance.toFixed(2) || '0.00'}\n\n` +
          `Maximum 2 accounts per Telegram ID allowed.\n\n` +
          `Please use one of the existing accounts or login to a different CoupX account.`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Use First Account", "use_existing_account")],
            [Markup.button.callback("✅ Use Second Account", "use_secondary_account")],
            [Markup.button.callback("🔑 Login to Different Account", "register_existing")],
            [Markup.button.callback("🔙 Back", "back_to_menu")],
          ]),
        }
      )
      return
    }

    // Create secondary account
    const result = await auth.createAccount(secondaryEmail, ctx.from.first_name || username, "")

    if (result.success && result.credentials) {
      const { email: createdEmail, password } = result.credentials
      const { userId } = result

      // Store in session, ask for linking confirmation
      ctx.session!.tempNewUserId = userId
      ctx.session!.tempNewEmail = createdEmail
      ctx.session!.tempNewPassword = password

      await ctx.editMessageText(
        `✅ *New Account Created Successfully!*\n\n` +
          `📧 Email: \`${createdEmail}\`\n` +
          `🔑 Password: \`${password}\`\n\n` +
          `⚠️ *IMPORTANT:* Save these credentials!\n\n` +
          `Do you want to link this account to your Telegram?`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Yes, Link Account", "link_new_secondary_account")],
            [Markup.button.callback("❌ No, Just Show Credentials", "skip_linking")],
          ]),
        }
      )
    } else {
      await ctx.editMessageText(
        `❌ Failed to create account: ${result.error}\n\nPlease try again.`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🔄 Try Again", "register_new")]]),
        }
      )
    }
  } catch (error: any) {
    console.error("⚠️ Error in create_secondary_account:", error)
    await ctx.reply("❌ An error occurred.")
  }
})

// CALLBACK: link_new_secondary_account - Link the newly created secondary account
bot.action("link_new_secondary_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    await ctx.editMessageText("⏳ Linking account to Telegram...\n_Please wait, this may take a few moments..._", {
      parse_mode: "Markdown"
    })
    
    const telegramId = ctx.from.id
    const userId = ctx.session!.tempNewUserId
    const email = ctx.session!.tempNewEmail

    console.log("🔗 Attempting to link secondary account:", { userId, email, telegramId })

    // Wait and poll for user_profile to be created (max 20 seconds)
    let profileExists = false
    let attempts = 0
    const maxAttempts = 20
    let manualCreateAttempted = false

    while (!profileExists && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
      
      console.log(`📊 Polling attempt ${attempts}/${maxAttempts} for user profile...`)
      
      try {
        const user = await db.getUserById(userId!)
        if (user) {
          console.log("✅ User profile found:", user.email)
          profileExists = true
          break
        }
      } catch (error) {
        console.log(`⚠️ Error checking user profile (attempt ${attempts}):`, error)
      }

      // After 5 attempts (5 seconds), try to manually create the profile
      if (attempts === 5 && !manualCreateAttempted) {
        console.log("⚙️ Attempting to manually create user profile...")
        manualCreateAttempted = true
        await db.createUserProfile(userId!)
      }
    }

    if (!profileExists) {
      console.error("❌ User profile not created after", maxAttempts, "seconds")
      await ctx.editMessageText(
        "❌ *Account Creation Error*\n\n" +
          "User profile was not created properly. Please try again or contact support.\n\n" +
          `📧 Email: \`${email}\`\n` +
          `🔑 Password: \`${ctx.session!.tempNewPassword}\`\n\n` +
          "You can use these credentials to login at the website.",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_to_menu")]]),
        }
      )
      return
    }

    // Now link the telegram account
    console.log("🔗 User profile exists, attempting to link telegram_id...")
    const linkSuccess = await db.linkTelegramAccount(userId!, telegramId.toString())

    if (linkSuccess) {
      console.log("✅ Successfully linked telegram account")
      ctx.session!.isAuthenticated = true
      ctx.session!.userId = userId
      ctx.session!.email = email
      delete ctx.session!.tempNewUserId
      delete ctx.session!.tempNewEmail
      delete ctx.session!.tempNewPassword
      delete ctx.session!.tempExistingUserId
      delete ctx.session!.tempExistingEmail
      delete ctx.session!.tempSecondaryUserId
      delete ctx.session!.tempSecondaryEmail

      await ctx.editMessageText(
        `✅ *Account Linked Successfully!*\n\n` +
          `You can now use this bot with your new account.\n\n` +
          `📧 Email: \`${email!}\``,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("🏠 Continue to Menu", "credentials_saved")]]),
        }
      )
    } else {
      console.error("❌ Failed to link telegram account")
      await ctx.editMessageText("❌ Failed to link account. Please try again.", {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_to_menu")]]),
      })
    }
  } catch (error: any) {
    console.error("⚠️ Error in link_new_secondary_account:", error)
    await ctx.reply("❌ An error occurred.")
  }
})

// CALLBACK: skip_linking - Don't link new account, just show credentials
bot.action("skip_linking", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const email = ctx.session!.tempNewEmail
    const password = ctx.session!.tempNewPassword

    delete ctx.session!.tempNewUserId
    delete ctx.session!.tempNewEmail
    delete ctx.session!.tempNewPassword
    delete ctx.session!.tempExistingUserId
    delete ctx.session!.tempExistingEmail
    delete ctx.session!.tempSecondaryUserId
    delete ctx.session!.tempSecondaryEmail

    await ctx.editMessageText(
      `✅ *Account Created (Not Linked)*\n\n` +
        `📧 Email: \`${email!}\`\n` +
        `🔑 Password: \`${password}\`\n\n` +
        `⚠️ This account is NOT linked to Telegram.\n` +
        `You can use these credentials to login at ${SITE_URL}\n\n` +
        `To use the bot, please send /start again.`,
      {
        parse_mode: "Markdown",
      }
    )
  } catch (error: any) {
    console.error("⚠️ Error in skip_linking:", error)
    await ctx.reply("❌ An error occurred.")
  }
})

// CALLBACK: credentials_saved - Show main menu
bot.action("credentials_saved", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    // Delete the credentials message so password isn't permanently in chat history
    try { await ctx.deleteMessage() } catch {}
    await ctx.reply(
      `🎉 *Welcome to CoupX!*\n\n` +
        `Your account is now linked to this Telegram bot.\n\n` +
        `Use the menu below to browse coupons, check balance, and more!`,
      { parse_mode: "Markdown", ...mainMenuKeyboard }
    )
  } catch (error: any) {
    console.error(" Error in credentials_saved:", error)
  }
})

// CALLBACK: register_existing - Start login flow
bot.action("register_existing", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session!.awaitingInput = "email"

    await ctx.editMessageText(
      `📧 *Existing User Login*\n\n` +
        `Please enter your email address:\n\n` +
        `_Type your email and send it as a message_`,
      { parse_mode: "Markdown" }
    )
  } catch (error: any) {
    console.error(" Error in register_existing:", error)
  }
})

// CALLBACK: link_account_yes - Link Telegram to existing account
bot.action("link_account_yes", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!
    const telegramId = ctx.from.id

    if (!session.userId) {
      await ctx.reply("❌ Session expired. Please /start again.")
      return
    }

    const linked = await db.linkTelegramAccount(session.userId, telegramId.toString())

    if (linked) {
      session.isAuthenticated = true
      await ctx.editMessageText(
        `✅ *Account Linked Successfully!*\n\n` +
          `Your CoupX account is now linked to this Telegram bot.`,
        { parse_mode: "Markdown" }
      )
      await ctx.reply("Choose an option:", mainMenuKeyboard)
    } else {
      await ctx.editMessageText(
        `❌ Failed to link account. Please try /start again or contact support.`,
        { parse_mode: "Markdown" }
      )
    }
  } catch (error: any) {
    console.error(" Error in link_account_yes:", error)
  }
})

// CALLBACK: link_account_no - Don't link account
bot.action("link_account_no", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session!.isAuthenticated = false
    ctx.session!.userId = undefined
    ctx.session!.email = undefined

    await ctx.editMessageText(
      `❌ *Login Cancelled*\n\n` + `You can try again anytime by sending /start`,
      { parse_mode: "Markdown" }
    )
  } catch (error: any) {
    console.error(" Error in link_account_no:", error)
  }
})

// CALLBACK: back_to_menu - Return to main menu
bot.action("back_to_menu", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    // Clear any pending input state
    if (ctx.session) {
      ctx.session.awaitingInput = undefined
    }
    await ctx.deleteMessage()
    await ctx.reply("Choose an option:", mainMenuKeyboard)
  } catch (error: any) {
    console.error(" Error in back_to_menu:", error)
  }
})

// CALLBACK: back_to_menu_keep — like back_to_menu but does NOT delete the message (used for success messages)
bot.action("back_to_menu_keep", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    if (ctx.session) {
      ctx.session.awaitingInput = undefined
    }
    // Remove the inline keyboard from the success message without deleting it
    try { await ctx.editMessageReplyMarkup(undefined) } catch {}
    await ctx.reply("Choose an option:", mainMenuKeyboard)
  } catch (error: any) {
    console.error(" Error in back_to_menu_keep:", error)
  }
})

// CALLBACK: store_{id} - Show coupons for selected store
bot.action(/^store_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const storeId = ctx.match[1]
    const session = ctx.session!
    session.selectedStoreId = storeId

    const coupons = await db.getStoreCoupons(storeId)
    if (coupons.length === 0) {
      await ctx.editMessageText(
        "No coupons available for this store at the moment.",
        Markup.inlineKeyboard([[Markup.button.callback("🔙 Back to Stores", "show_stores")]])
      )
      return
    }

    const buttons = coupons.map((coupon: any) => [
      Markup.button.callback(
        `🎟️ ${coupon.name} (📦 ${coupon.quantity} left)`,
        `coupon_${coupon.id}`
      ),
    ])
    buttons.push([Markup.button.callback("🔙 Back to Stores", "show_stores")])

    await ctx.editMessageText("🎉 *Available Coupons:*", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    })
  } catch (error: any) {
    console.error(" Error in store callback:", error)
  }
})

// CALLBACK: show_stores - Show stores list
bot.action("show_stores", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const stores = await db.getActiveStores()
    const buttons = stores.map((store: any) => [
      Markup.button.callback(
        `${store.name} (${store.slots_aggregate?.aggregate?.count || 0} coupons)`,
        `store_${store.id}`
      ),
    ])
    buttons.push([Markup.button.callback("🏠 Back to Menu", "back_to_menu")])

    await ctx.editMessageText("🏪 *Choose a Store:*", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    })
  } catch (error: any) {
    console.error(" Error in show_stores:", error)
  }
})

// CALLBACK: coupon_{id} - Show pricing tiers and ask for quantity
bot.action(/^coupon_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const couponId = ctx.match[1]
    const session = ctx.session!

    // Fetch coupon details with pricing tiers
    const coupon = await db.getSlotWithPrice(couponId)

    if (!coupon || coupon.quantity === 0) {
      await ctx.editMessageText(
        "❌ Coupon not available.",
        Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "store_" + session.selectedStoreId)]])
      )
      return
    }

    session.selectedCouponId = couponId
    session.selectedCouponName = coupon.name
    session.selectedCouponPricingTiers = coupon.pricing_tiers
    session.awaitingInput = "quantity"

    // Format pricing tiers
    let pricingText = ""
    coupon.pricing_tiers.forEach((tier: any) => {
      const range = tier.max_quantity
        ? `${tier.min_quantity}-${tier.max_quantity}`
        : `${tier.min_quantity}+`
      const label = tier.label ? ` 🏷️ ${tier.label}` : ""
      pricingText += `📦 ${range} coupons → ₹${tier.unit_price}/coupon${label}\n`
    })

    await ctx.editMessageText(
      `🎟️ *${coupon.name}*\n\n` +
        `${coupon.description ? `📝 ${coupon.description}\n\n` : ""}` +
        `💰 *Pricing Tiers:*\n${pricingText}\n` +
        `📦 Available Stock: ${coupon.quantity}\n\n` +
        `💬 *Enter the quantity you want:*\n_Type a number and send it_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "store_" + session.selectedStoreId)]]),
      }
    )
  } catch (error: any) {
    console.error("⚠️ Error in coupon callback:", error)
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
      await ctx.editMessageText(
        "❌ Purchase failed. Please try again or contact support.",
        Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]])
      )
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
          [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
        ]),
      }
    )

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

    // Return to main menu
    await ctx.reply("Choose an option:", mainMenuKeyboard)
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

    // Return to main menu
    await ctx.reply("Choose an option:", mainMenuKeyboard)
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
      await ctx.editMessageText(
        "No purchases found.",
        Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]])
      )
      return
    }

    const buttons = purchases.map((purchase: any) => [
      Markup.button.callback(
        `${purchase.slot.store?.name || "Store"} - ${purchase.slot.name} - ₹${purchase.total_price}`,
        `purchase_${purchase.id}`
      ),
    ])
    buttons.push([Markup.button.callback("🏠 Back to Menu", "back_to_menu")])

    await ctx.editMessageText("📦 *Your Recent Purchases:*", {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    })
  } catch (error: any) {
    console.error(" Error in show_purchases:", error)
  }
})

// CALLBACK: add_balance - Start the payment flow
bot.action("add_balance", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!

    if (!session.isAuthenticated || !session.userId) {
      await ctx.editMessageText(
        `❌ Please login first to add balance.`,
        { ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_to_menu")]]) }
      )
      return
    }

    session.awaitingInput = "add_balance_amount"

    await ctx.editMessageText(
      `💰 *Add Balance*\n\n` +
        `Enter the amount you want to add to your wallet:\n\n` +
        `• Minimum: ₹1\n` +
        `• Maximum: ₹10,000\n\n` +
        `_Type the amount and press send (e.g. 100)_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "back_to_menu")]]),
      }
    )
  } catch (error: any) {
    console.error(" Error in add_balance:", error)
  }
})

// CALLBACK: topup_history - Show recent wallet topup transactions
bot.action("topup_history", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!

    if (!session.isAuthenticated || !session.userId) {
      await ctx.editMessageText(
        `❌ Please login first.`,
        { ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_to_menu")]]) }
      )
      return
    }

    const topups = await db.getTopupHistory(session.userId, 10)

    if (topups.length === 0) {
      await ctx.editMessageText(
        `📋 *Topup History*\n\nNo topup transactions found.\nAdd balance to get started!`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("➕ Add Balance", "add_balance")],
            [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
          ]),
        }
      )
      return
    }

    const statusEmoji: Record<string, string> = {
      success: "✅",
      pending: "⏳",
      failed: "❌",
    }

    const historyLines = topups.map((t: any) => {
      const emoji = statusEmoji[t.status] || "🔄"
      const date = new Date(t.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
      return `${emoji} ₹${Number(t.amount).toFixed(2)} — ${t.status.toUpperCase()} — ${date}`
    })

    await ctx.editMessageText(
      `📋 *Topup History* _(last 10)_\n\n${historyLines.join("\n")}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("➕ Add Balance", "add_balance")],
          [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
        ]),
      }
    )
  } catch (error: any) {
    console.error(" Error in topup_history:", error)
  }
})

// CALLBACK: unlink_account - Confirm unlinking telegram
bot.action("unlink_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    await ctx.editMessageText(
      `⚠️ *Unlink Telegram Account*\n\n` +
        `Are you sure you want to unlink your Telegram account from CoupX?\n\n` +
        `You will need to login again to access your account through this bot.`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Yes, Unlink", "confirm_unlink")],
          [Markup.button.callback("❌ Cancel", "show_profile")],
        ]),
      }
    )
  } catch (error: any) {
    console.error(" Error in unlink_account:", error)
  }
})

// CALLBACK: confirm_unlink - Actually unlink the account
bot.action("confirm_unlink", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!

    const success = await db.unlinkTelegramAccount(session.userId!)

    if (success) {
      session.isAuthenticated = false
      session.userId = undefined
      session.email = undefined

      await ctx.editMessageText(
        `✅ *Account Unlinked*\n\n` +
          `Your Telegram account has been unlinked from CoupX.\n\n` +
          `Send /start to login again.`,
        { parse_mode: "Markdown" }
      )
    } else {
      await ctx.editMessageText(
        `❌ Failed to unlink account. Please try again later.`,
        Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "show_profile")]])
      )
    }
  } catch (error: any) {
    console.error(" Error in confirm_unlink:", error)
  }
})

// CALLBACK: delete_account - Show delete account confirmation
bot.action("delete_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    await ctx.editMessageText(
      `⚠️ *Delete Account*\n\n` +
        `Are you sure you want to permanently delete your CoupX account?\n\n` +
        `⚠️ *Warning:* This action cannot be undone!\n` +
        `• All your data will be permanently deleted\n` +
        `• Your wallet balance will be lost\n` +
        `• Your purchase history will be removed`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🗑️ Yes, Delete Forever", "confirm_delete_account")],
          [Markup.button.callback("❌ Cancel", "show_profile")],
        ]),
      }
    )
  } catch (error: any) {
    console.error(" Error in delete_account:", error)
  }
})

// CALLBACK: confirm_delete_account - Actually delete the account
bot.action("confirm_delete_account", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const session = ctx.session!

    const success = await db.deleteUser(session.userId!)

    if (success) {
      // Clear session
      session.isAuthenticated = false
      session.userId = undefined
      session.email = undefined

      await ctx.editMessageText(
        `✅ *Account Deleted*\n\n` +
          `Your CoupX account has been permanently deleted.\n\n` +
          `Thank you for using CoupX. Send /start if you want to create a new account.`,
        { parse_mode: "Markdown" }
      )
    } else {
      await ctx.editMessageText(
        `❌ Failed to delete account. Please try again later.`,
        Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "show_profile")]])
      )
    }
  } catch (error: any) {
    console.error(" Error in confirm_delete_account:", error)
  }
})

// CALLBACK: show_profile - Show profile details
bot.action("show_profile", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    // Clear any pending input state
    if (ctx.session) {
      ctx.session.awaitingInput = undefined
    }
    const user = await db.getUserById(ctx.session!.userId!)
    const stats = await db.getUserStats(ctx.session!.userId!)

    if (user) {
      await ctx.editMessageText(
        `👤 *Your CoupX Profile*\n\n` +
          `👨 Name: ${user.name}\n` +
          `📧 Email: ${user.email.replace(/_/g, '\\_')}\n` +
          `💰 Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
          `🎟️ Total Coupons Bought: ${stats.totalCouponsBought}`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✏️ Edit Name", "edit_name"), Markup.button.callback("📧 Edit Email", "edit_email")],
            [
              Markup.button.callback("🔑 Change Password", "change_password"),
              Markup.button.callback("🔄 Reset Password", "reset_password"),
            ],
            [Markup.button.callback("🔓 Unlink Telegram", "unlink_account")],
            [Markup.button.callback("🗑️ Delete Account", "delete_account")],
            [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
          ]),
        }
      )
    }
  } catch (error: any) {
    console.error(" Error in show_profile:", error)
  }
})

// CALLBACK: edit_name - Start name editing process
bot.action("edit_name", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session!.awaitingInput = "edit_name"

    await ctx.editMessageText(
      `✏️ *Edit Your Name*\n\n` + `Please enter your new name:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "show_profile")]]),
      }
    )
  } catch (error: any) {
    console.error(" Error in edit_name:", error)
  }
})

// CALLBACK: edit_email - Start email editing process
bot.action("edit_email", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session!.awaitingInput = "edit_email"

    await ctx.editMessageText(
      `📧 *Edit Your Email*\n\n` + `Please enter your new email address:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "show_profile")]]),
      }
    )
  } catch (error: any) {
    console.error(" Error in edit_email:", error)
  }
})

// CALLBACK: change_password - Start password change process
bot.action("change_password", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session!.awaitingInput = "change_password_old"

    await ctx.editMessageText(
      `🔑 *Change Password*\n\n` + `Please enter your *current password*:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "show_profile")]]),
      }
    )
  } catch (error: any) {
    console.error(" Error in change_password:", error)
  }
})

// CALLBACK: reset_password - Send password reset email
bot.action("reset_password", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const user = await db.getUserById(ctx.session!.userId!)

    if (!user) {
      await ctx.reply("❌ Error: User not found.")
      return
    }

    await ctx.editMessageText(
      `🔄 *Password Reset*\n\n` +
        `A password reset link will be sent to:\n📧 ${user.email.replace(/_/g, '\\_')}\n\n` +
        `After you reset your password via email, you can continue using the bot normally.\n\n` +
        `_Note: You will need to log in again with your new password if you unlink your Telegram account._`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📨 Send Reset Link", "confirm_reset_password")],
          [Markup.button.callback("❌ Cancel", "show_profile")],
        ]),
      }
    )
  } catch (error: any) {
    console.error(" Error in reset_password:", error)
  }
})

// CALLBACK: confirm_reset_password - Actually send the reset email
bot.action("confirm_reset_password", async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const user = await db.getUserById(ctx.session!.userId!)

    if (!user) {
      await ctx.reply("❌ Error: User not found.")
      return
    }

    // TODO: Call Nhost password reset API
    // For now, just show a message
    await ctx.editMessageText(
      `✅ *Password Reset Email Sent!*\n\n` +
        `Please check your email: ${user.email.replace(/_/g, '\\_')}\n\n` +
        `Follow the link in the email to reset your password.\n\n` +
        `_This feature will be fully implemented soon._`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]]),
      }
    )
  } catch (error: any) {
    console.error(" Error in confirm_reset_password:", error)
  }
})

// TEXT MESSAGE HANDLER - For email/password input
bot.on(message("text"), async (ctx) => {
  const session = ctx.session!
  const text = ctx.message.text

  // Skip if it's a command
  if (text.startsWith("/")) return

  try {
    // Handle email input
    if (session.awaitingInput === "email") {
      const email = text.trim()

      // Basic email validation
      if (!email.includes("@") || !email.includes(".")) {
        await ctx.reply("❌ Please enter a valid email address.")
        return
      }

      session.tempEmail = email
      session.awaitingInput = "password"

      await ctx.reply(`📧 Email: ${email}\n\n🔑 Now enter your password:`, {
        reply_markup: { force_reply: true },
      })
    }
    // Handle password input
    else if (session.awaitingInput === "password") {
      const password = text.trim()
      const email = session.tempEmail!

      await ctx.reply("🔄 Verifying credentials...")

      const result = await auth.loginUser(email, password)

      if (result.success && result.userId) {
        // Check if this account is already linked to a different Telegram
        const user = await db.getUserById(result.userId)

        if (user?.telegram_id && user.telegram_id !== ctx.from.id.toString()) {
          await ctx.reply(
            `⚠️ *Account Already Linked*\n\n` +
              `This CoupX account is already linked to a different Telegram account.\n\n` +
              `Please use that Telegram account or contact support.`,
            { parse_mode: "Markdown" }
          )
          session.awaitingInput = null
          return
        }

        // If not linked, ask to link
        if (!user?.telegram_id) {
          session.userId = result.userId
          session.email = email
          session.awaitingInput = null

          await ctx.reply(
            `✅ *Login Successful!*\n\n` +
              `Do you want to link this CoupX account to your Telegram?\n\n` +
              `This will allow you to access your account directly from this bot.`,
            {
              parse_mode: "Markdown",
              ...Markup.inlineKeyboard([
                [
                  Markup.button.callback("✅ Yes, Link Account", "link_account_yes"),
                  Markup.button.callback("❌ No, Thanks", "link_account_no"),
                ],
              ]),
            }
          )
        } else {
          // Already linked to this Telegram
          session.isAuthenticated = true
          session.userId = result.userId
          session.email = email
          session.awaitingInput = null

          await ctx.reply(
            `✅ *Welcome back!*\n\n💰 Balance: ₹${user.wallet_balance.toFixed(2)}`,
            {
              parse_mode: "Markdown",
              ...mainMenuKeyboard,
            }
          )
        }
      } else {
        await ctx.reply(
          `❌ *Login Failed*\n\n${result.error || "Invalid email or password"}\n\nPlease try again or send /start to restart.`,
          { parse_mode: "Markdown" }
        )
        session.awaitingInput = null
      }
    }
    // Handle quantity input for coupon purchase
    else if (session.awaitingInput === "quantity") {
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
            `Please add balance first.`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.callback("💰 Add Balance", "add_balance")],
              [Markup.button.callback("🔙 Back", "coupon_" + session.selectedCouponId)],
            ]),
          }
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
            [Markup.button.callback("🔙 Cancel", "back_to_menu")],
          ]),
        }
      )
    }
    // Handle edit name input
    else if (session.awaitingInput === "edit_name") {
      const newName = text.trim()

      if (newName.length < 2) {
        await ctx.reply("❌ Name must be at least 2 characters long.")
        return
      }

      // Update name via GraphQL
      const updateResult = await db.updateUserProfile(session.userId!, { name: newName })

      if (updateResult) {
        session.awaitingInput = null
        await ctx.reply(
          `✅ *Name Updated Successfully!*\n\n` + `Your new name: ${newName}`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback("👤 View Profile", "show_profile")]]),
          }
        )
      } else {
        await ctx.reply("❌ Failed to update name. Please try again.")
      }
    }
    // Handle edit email input
    else if (session.awaitingInput === "edit_email") {
      const newEmail = text.trim()

      // Basic email validation
      if (!newEmail.includes("@") || !newEmail.includes(".")) {
        await ctx.reply("❌ Please enter a valid email address.")
        return
      }

      // TODO: Update email via Nhost API (requires verification)
      session.awaitingInput = null

      await ctx.reply(
        `📧 *Email Update Request*\n\n` +
          `Updating email to: ${newEmail}\n\n` +
          `_Note: This feature requires email verification and will be fully implemented soon. For now, please contact support to change your email._`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("👤 Back to Profile", "show_profile")]]),
        }
      )
    }
    // Handle old password input
    else if (session.awaitingInput === "change_password_old") {
      const oldPassword = text.trim()

      // Verify old password
      const user = await db.getUserById(session.userId!)
      if (!user) {
        await ctx.reply("❌ Error: User not found.")
        session.awaitingInput = null
        return
      }

      const loginResult = await auth.loginUser(user.email, oldPassword)

      if (!loginResult.success) {
        await ctx.reply(
          "❌ *Incorrect Password*\n\n" + "The current password you entered is incorrect. Please try again.",
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Cancel", "show_profile")]]),
          }
        )
        session.awaitingInput = null
        return
      }

      // Old password correct, ask for new password
      session.awaitingInput = "change_password_new"

      await ctx.reply(
        `✅ *Current password verified!*\n\n` +
          `🔑 Now enter your *new password*:\n\n` +
          `_Requirements:_\n` +
          `• Minimum 8 characters\n` +
          `• Mix of letters and numbers recommended`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "show_profile")]]),
        }
      )
    }
    // Handle new password input
    else if (session.awaitingInput === "change_password_new") {
      const newPassword = text.trim()

      if (newPassword.length < 8) {
        await ctx.reply("❌ Password must be at least 8 characters long. Please try again.")
        return
      }

      // TODO: Update password via Nhost API
      session.awaitingInput = null

      await ctx.reply(
        `🔑 *Password Change Request*\n\n` +
          `_Note: This feature will be fully implemented soon. For now, please use the "Reset Password" option to receive a reset link via email._`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Reset Password Instead", "reset_password")],
            [Markup.button.callback("👤 Back to Profile", "show_profile")],
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
            ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "back_to_menu")]]),
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
                [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
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
              [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
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
                    {
                      parse_mode: "Markdown",
                      ...Markup.inlineKeyboard([
                        [Markup.button.callback("🏠 Back to Menu", "back_to_menu_keep")],
                      ]),
                    }
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
                  `Tap *Add Balance* again to create a new payment.`,
                {
                  parse_mode: "Markdown",
                  ...Markup.inlineKeyboard([
                    [Markup.button.callback("➕ Add Balance Again", "add_balance")],
                    [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
                  ]),
                }
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
              [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
            ]),
          }
        )
      }
    }
    // Handle main menu buttons
    else if (session.isAuthenticated) {
      // COUPONS MENU
      if (text === "🎟️ Coupons") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        const stores = await db.getActiveStores()
        if (stores.length === 0) {
          await ctx.reply("No stores available at the moment. Please check back later!")
          return
        }

        const buttons = stores.map((store: any) => [
          Markup.button.callback(
            `${store.name} (${store.slots_aggregate?.aggregate?.count || 0} coupons)`,
            `store_${store.id}`
          ),
        ])
        buttons.push([Markup.button.callback("🏠 Back to Menu", "back_to_menu")])

        await ctx.reply("🏬 *Choose a Store:*", {
          parse_mode: "Markdown",
          reply_markup: {
            remove_keyboard: true,
          },
        })
        await ctx.reply("Select a store:", Markup.inlineKeyboard(buttons))
      }
      // BALANCE MENU
      else if (text === "💰 Balance") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        const user = await db.getUserById(session.userId!)
        if (user) {
          await ctx.reply(
            `💰 *Your Wallet*\n\n` +
              `💵 Current Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
              `🛍️ Total Spent: ₹${(user.total_spent || 0).toFixed(2)}`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                remove_keyboard: true,
              },
            }
          )
          await ctx.reply(
            "Choose an option:",
            Markup.inlineKeyboard([
              [Markup.button.callback("➕ Add Balance", "add_balance")],
              [Markup.button.callback("📋 Topup History", "topup_history")],
              [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
            ])
          )
        }
      }
      // RECENT PURCHASES MENU
      else if (text === "📦 Recent Purchases") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        const purchases = await db.getUserPurchases(session.userId!, 10)
        if (purchases.length === 0) {
          await ctx.reply(
            "📦 *Recent Purchases*\n\nYou haven't made any purchases yet.\nVisit the Coupons section to get started!",
            {
              parse_mode: "Markdown",
              reply_markup: { remove_keyboard: true },
            }
          )
          await ctx.reply(
            "Choose an option:",
            Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]])
          )
          return
        }

        const buttons = purchases.map((purchase: any) => [
          Markup.button.callback(
            `${purchase.slot.store?.name || "Store"} - ${purchase.slot.name} - ₹${purchase.total_price}`,
            `purchase_${purchase.id}`
          ),
        ])
        buttons.push([Markup.button.callback("🏠 Back to Menu", "back_to_menu")])

        await ctx.reply("📦 *Your Recent Purchases:*", {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true },
        })
        await ctx.reply("Select a purchase:", Markup.inlineKeyboard(buttons))
      }
      // PROFILE MENU
      else if (text === "👤 CoupX Profile") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        const user = await db.getUserById(session.userId!)
        const stats = await db.getUserStats(session.userId!)
        if (user) {
          await ctx.reply(
            `👤 *Your CoupX Profile*\n\n` +
              `👨 Name: ${user.name}\n` +
              `📧 Email: ${user.email.replace(/_/g, '\\_')}\n` +
              `💰 Balance: ₹${user.wallet_balance.toFixed(2)}\n` +
              `🎟️ Total Coupons Bought: ${stats.totalCouponsBought}`,
            {
              parse_mode: "Markdown",
              reply_markup: { remove_keyboard: true },
            }
          )
          await ctx.reply(
            "Manage your account:",
            Markup.inlineKeyboard([
              [Markup.button.callback("✏️ Edit Name", "edit_name"), Markup.button.callback("📧 Edit Email", "edit_email")],
              [
                Markup.button.callback("🔑 Change Password", "change_password"),
                Markup.button.callback("🔄 Reset Password", "reset_password"),
              ],
              [Markup.button.callback("🔓 Unlink Telegram", "unlink_account")],
              [Markup.button.callback("🗑️ Delete Account", "delete_account")],
              [Markup.button.callback("🏠 Back to Menu", "back_to_menu")],
            ])
          )
        }
      }
      // HELP MENU
      else if (text === "❓ Help") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        await ctx.reply(
          `❓ *Help & Support*\n\n` +
            `🌐 Website: ${SITE_URL}\n` +
            `📧 Email Support: coupxofficial@gmail.com\n` +
            `💬 Telegram Support: @coupx\_support\n` +
            `📢 Updates Channel: @coupxofficial\n\n` +
            `*Available Commands:*\n` +
            `/start - Restart the bot\n\n` +
            `*Menu Options:*\n` +
            `🎟️ Coupons - Browse and buy coupons\n` +
            `📢 CoupX Updates - Join our channel\n` +
            `💰 Balance - Check wallet & add balance\n` +
            `📦 Recent Purchases - View your orders\n` +
            `👤 CoupX Profile - Manage your account\n` +
            `❓ Help - This message`,
          {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true },
          }
        )
        await ctx.reply(
          "Choose an option:",
          Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]])
        )
      }
      // COUPX UPDATES - Redirect to channel
      else if (text === "📢 CoupX Updates") {
        // Clear any pending input state
        session.awaitingInput = undefined
        
        await ctx.reply(
          `📢 *Join Our Official Channel!*\n\n` +
            `Stay updated with:  \n` +
            `✅ New coupon releases\n` +
            `✅ Exclusive discounts\n` +
            `✅ Flash sales & offers\n` +
            `✅ Platform updates\n\n` +
            `👉 https://t.me/coupxofficial`,
          {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true },
          }
        )
        await ctx.reply(
          "Choose an option:",
          Markup.inlineKeyboard([[Markup.button.callback("🏠 Back to Menu", "back_to_menu")]])
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
  console.log(" CoupX Telegram Bot starting...")

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
