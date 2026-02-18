# CoupX Telegram Bot

A full-featured Telegram bot for the CoupX coupon marketplace.

## Features

### User Features
- 🔐 **Account Linking**: Link your CoupX account via email
- 💰 **Wallet Balance**: Check your wallet balance anytime
- 🛍️ **Purchase History**: View all your coupon purchases
- 🏪 **Browse Stores**: Explore available stores and coupons
- 💳 **Add Balance**: Top up wallet via IMB Payment Gateway
- 🎫 **Buy Coupons**: Purchase coupons directly from the bot

### Payment Integration
- Integrated with IMB Payment Gateway
- QR code payment support
- UTR-based payment verification
- Real-time balance updates

## Setup

### Prerequisites
1. Telegram Bot Token from [@BotFather](https://t.me/BotFather)
2. CoupX website running with Nhost backend
3. IMB Payment Gateway credentials

### Environment Variables

Add to your `.env` or `.env.local`:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com (optional, for production)

# Nhost (already configured)
NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
NEXT_PUBLIC_NHOST_REGION=ap-south-1
NHOST_ADMIN_SECRET=your_admin_secret

# IMB Payment Gateway (already configured)
IMB_API_TOKEN=your_imb_token
IMB_BASE_URL=https://secure-stage.imb.org.in

# Site URL
NEXT_PUBLIC_SITE_URL=https://coupx.in
```

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the bot:
```bash
pnpm build:bot
```

3. Run the bot:

**Development (polling):**
```bash
pnpm bot:dev
```

**Production (recommended to use webhooks):**
```bash
pnpm bot:start
```

## Bot Commands

### Authentication
- `/start` - Start the bot and authenticate
- `/register <email>` - Link your CoupX account

### Wallet & Balance
- `💰 Balance` - View wallet balance
- `💳 Add Balance` - Top up your wallet
- `/utr <number>` - Verify payment with UTR

### Shopping
- `🏪 Browse Stores` - See all available stores
- `/store <number>` - View coupons in a specific store
- `/buy <store> <coupon>` - Purchase a coupon
- `/confirm` - Confirm pending purchase
- `/cancel` - Cancel pending action

### History
- `🛍️ My Purchases` - View purchase history
- `/purchase <id>` - View specific purchase details (planned)

### Help
- `❓ Help` - Show help message

## Database Schema Requirements

The bot requires the following table structure:

### user_profiles
- `id` (uuid)
- `telegram_id` (text, nullable) - Links Telegram account
- `wallet_balance` (numeric)
- `phone` (text)
- `user` relation → users.id

### stores
- `id` (uuid)
- `name` (text)
- `description` (text)
- `is_active` (boolean)

### slots (coupons)
- `id` (uuid)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `quantity` (integer)
- `store_id` (uuid)

### purchases
- `id` (uuid)
- `user_id` (uuid)
- `slot_id` (uuid)
- `total_price` (numeric)
- `payment_method` (text)
- `status` (text)
- `coupon_data` (jsonb)
- `created_at` (timestamp)

### topups
- `id` (uuid)
- `user_id` (uuid)
- `amount` (numeric)
- `transaction_id` (text)
- `status` (text)
- `payment_method` (text)
- `razorpay_order_id` (text) - IMB Order ID
- `razorpay_payment_id` (text) - IMB UTR
- `created_at` (timestamp)

## Migration

Add `telegram_id` column to `user_profiles` table:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS telegram_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_telegram_id 
ON user_profiles(telegram_id);
```

## Architecture

```
bot/
├── index.ts              # Main bot entry point
├── types.ts              # TypeScript interfaces
└── services/
    ├── database.ts       # Nhost/Hasura GraphQL queries
    └── payment.ts        # IMB payment integration
```

## Production Deployment

### Option 1: Webhooks (Recommended)

1. Set `TELEGRAM_WEBHOOK_DOMAIN` in environment
2. Create a Next.js API route at `/pages/api/telegram-webhook.ts`
3. Forward updates to the bot

Example webhook handler:
```typescript
import bot from '@/bot/index'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body)
    res.status(200).send('OK')
  } else {
    res.status(405).send('Method Not Allowed')
  }
}
```

### Option 2: Polling (Simple)

Just run `pnpm bot:start` on your server. Not recommended for production.

### Option 3: Separate Process

Deploy the bot as a separate Node.js process on services like:
- Railway
- Render
- Heroku
- VPS with PM2

## Security

- Bot uses Nhost admin secret for database access
- Payment verification through existing IMB API
- User authentication via email verification
- Session state stored in memory (use Redis for production at scale)

## Support

For issues or questions:
- Email: support@coupx.in
- Website: https://coupx.in

## License

Proprietary - CoupX 2026
