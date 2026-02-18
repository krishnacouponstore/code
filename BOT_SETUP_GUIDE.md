# CoupX Telegram Bot - Quick Start Guide

## Overview
This Telegram bot allows users to manage their CoupX accounts directly through Telegram with an easy registration flow.

## Features
- **Auto-Registration**: New users get instant accounts with @yopmail.com
- **Account Linking**: Existing users can link their CoupX accounts  
- **Balance Checking**: View wallet balance and spending
- **Profile Access**: Direct link to web profile  
- **Coupon Browsing**: Browse and purchase coupons (coming soon)
- **Purchase History**: View recent orders (coming soon)

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Telegram account
- CoupX website running (for account management)

### 2. Create Bot on Telegram
1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts to name your bot (e.g., "CoupX Bot")
4. Choose username (e.g., "coupxbot")
5. **Save the bot token** - you'll need this!

### 3. Configure Environment
Add to your `.env` file:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=coupxbot
TELEGRAM_WEBHOOK_DOMAIN=  # Leave empty for development (uses polling)

# Nhost (should already be configured)
NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
NEXT_PUBLIC_NHOST_REGION=ap-south-1
NHOST_ADMIN_SECRET=rohanpwd123

# Site URL
NEXT_PUBLIC_SITE_URL=https://coupx.in
```

### 4. Run Database Migration
1. Go to [Nhost Console](https://app.nhost.io)
2. Navigate to your project → **SQL Editor**
3. Copy and paste content from `migrations/006_add_telegram_integration.sql`
4. Click **Run**
5. Verify: `SELECT telegram_id FROM user_profiles LIMIT 1;` should work

### 5. Install Dependencies
```bash
npm install
```

### 6. Start the Bot
**Development (with auto-reload):**
```bash
npm run bot:dev
```

**Production:**
```bash
npm run bot:build
npm run bot:start
```

You should see:
```
✅ Bot token loaded successfully
🌐 Site URL: https://coupx.in
🤖 CoupX Telegram Bot starting...
✅ Bot started with polling
```

## User Flow

### New User Flow
1. User opens bot → `/start `
2. Bot shows: "New CoupX User" or "Existing CoupX User"
3. User clicks "🆕 New CoupX User"
4. Bot checks for Telegram username
   - ❌ No username → Shows error with instructions
   - ✅ Has username → Creates account
5. Bot creates account:
   - Email: `{username}@yopmail.com`
   - Password: Auto-generated (12 chars)
   - Display name: `{username}`
6. Bot shows credentials in message (tap to copy)
7. User clicks "✅ I've Saved My Credentials"
8. Main menu appears with 5 options

### Existing User Flow
1. User opens bot → `/start`
2. User clicks "✅ Existing CoupX User"
3. Bot asks for email
4. User enters email
5. Bot asks for password (shows "Forgot Password" link)
6. User enters password
7. Bot verifies credentials via Nhost Auth API
8. If account not linked to Telegram:
   - Bot asks: "Link this account?"
   - User clicks "✅ Yes, Link Account"
   - Bot updates `telegram_id` in database
9. Main menu appears

### Returning User Flow
1. User opens bot → `/start`
2. Bot finds `telegram_id` in database
3. Shows: "👋 Welcome back, {name}!"
4. Displays balance
5. Main menu appears immediately

## Main Menu Options

| Button | Action | Status |
|--------|--------|--------|
| 🎫 Coupons | Browse and purchase coupons | Coming Soon |
| 💰 Balance | View wallet balance + total spent | ✅ Working |
| 🛍️ Recent Purchases | View purchase history | Coming Soon |
| 👤 CoupX Profile | Open website profile page | ✅ Working |
| ❓ Help | Show help message | ✅ Working |

## Testing

### Test New User Registration
```
/start
→ Click "🆕 New CoupX User"
→ Should show: email and password
→ Click "✅ I've Saved My Credentials"
→ Should show main menu
→ Click "💰 Balance"
→ Should show: ₹0.00 balance
```

### Test Existing User Login
```
/start
→ Click "✅ Existing CoupX User"  
→ Enter: your@email.com
→ Enter: yourpassword
→ Click "✅ Yes, Link Account"
→ Should show main menu
→ Click "💰 Balance"
→ Should show actual balance
```

### Test Already Linked
```
/start (from same Telegram account twice)
→ Should immediately show: "Welcome back, {name}!"
```

## Troubleshooting

### Bot doesn't start
**Error:** `TELEGRAM_BOT_TOKEN is required`
- **Fix:** Add token to `.env` file
- Verify: `echo $env:TELEGRAM_BOT_TOKEN` (PowerShell)

### "Forbidden: bot was blocked by the user"
- User needs to unblock bot in Telegram settings

### Account creation fails
- Check Nhost credentials in `.env`
- Verify migration 006 was run
- Check bot console for error details

### "This account is already linked"
- Each Telegram can only link to one CoupX account
- User needs to use different email or Telegram account

## Architecture

```
┌─────────────────┐
│  Telegram User  │
└────────┬────────┘
         │ /start, messages
         ▼
┌─────────────────┐
│   bot/index.ts  │ ◄── Main bot logic
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌──────┐
│ Auth│   │  DB  │
│Svc  │   │ Svc  │
└──┬──┘   └───┬──┘
   │          │
   │  Nhost   │
   │  Auth    │  GraphQL
   │  API     │  Hasura
   ▼          ▼
┌──────────────────┐
│  Nhost Backend   │
│  ├─ users        │
│  ├─ user_profiles│
│  └─ roles        │
└──────────────────┘
```

## Production Deployment

### Option 1: Webhook (Recommended)
1. Set `TELEGRAM_WEBHOOK_DOMAIN=https://coupx.in`
2. Create API route: `app/api/telegram/webhook/route.ts`
3. Bot will use webhooks instead of polling

### Option 2: Separate Process
1. Deploy bot as separate Node.js app
2. Keep `TELEGRAM_WEBHOOK_DOMAIN` empty  
3. Use polling mode (current setup)

## Support

For issues or questions:
- **Email:** support@coupx.in
- **Bot Commands:** Send `/help` in bot
- **Website:** https://coupx.in

## Security Notes

- ✅ Passwords auto-generated (12 chars, mixed case + symbols)
- ✅ Bot uses Nhost Admin Secret (server-only)
- ✅ User credentials sent only once (deleted after save)
- ✅ Telegram IDs stored as TEXT (privacy)
- ⚠️ @yopmail.com emails are disposable (intentional for easy testing)

---

**Next Steps:**
1. Run migration 006
2. Start bot: `npm run bot:dev`
3. Test with your Telegram account
4. Implement coupon browsing feature
5. Add purchase flow
6. Deploy to production
