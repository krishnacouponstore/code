# Hunt Coupon Store — Telegram bot
# Self-contained: installs ONLY the bot's runtime deps (no pg / pg-native), so the
# image builds cleanly without the native libpq toolchain. Used for both local
# testing and server deployment.
#
# Build (from the bot/ directory):
#   docker build -t hunt-bot -f Dockerfile .
# Run (polling mode — local testing; pass your env file):
#   docker run --rm --env-file ../.env hunt-bot
# Run (webhook mode — server): set TELEGRAM_WEBHOOK_DOMAIN in the env file and
#   publish the port:  docker run -d -p 3001:3001 --env-file ../.env hunt-bot

FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching). Only the bot's package.json is used.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy bot source (index.ts, services/, types.ts, tsconfig.json)
COPY . ./

# Webhook port (only used when TELEGRAM_WEBHOOK_DOMAIN is set; harmless otherwise)
EXPOSE 3001

# Health check (only meaningful in webhook mode; in polling mode it will fail
# harmlessly — override/remove if you run pure polling in production).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# tsx runs the TypeScript entrypoint directly (no separate build step needed)
CMD ["npm", "run", "start"]
