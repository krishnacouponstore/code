# CoupX Telegram Bot — AWS EC2 Setup Guide

## Server Info
- **Instance**: EC2 t3.small
- **OS**: Ubuntu 24.04
- **Elastic IP**: 3.111.151.89
- **Domain**: bot.coupx.in → points to 3.111.151.89
- **Bot**: @coupxbot
- **App directory**: `~/code`

---

## 1. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@3.111.151.89
```

---

## 2. Install Node.js (via NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
npm -v
```

---

## 3. Install System Dependencies

These were required for native npm packages (bcrypt, pg, etc.):

```bash
sudo apt update
sudo apt install -y build-essential libpq-dev
```

---

## 4. Clone Private GitHub Repo via SSH

### Generate SSH key on the server
```bash
ssh-keygen -t ed25519 -C "ec2-coupx" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Copy the output and add it to GitHub:
> GitHub → Repo → Settings → Deploy keys → Add deploy key → Paste → Allow write access: NO

### Configure SSH to use the deploy key
```bash
nano ~/.ssh/config
```

Add:
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
```

```bash
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/github_deploy
```

### Test connection
```bash
ssh -T git@github.com
```

Expected output: `Hi <repo>! You've successfully authenticated...`

### Clone the repo
```bash
cd ~
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git code
cd code
```

---

## 5. Install Project Dependencies

```bash
cd ~/code
npm install
```

If you see errors about `node-gyp` or native modules:
```bash
sudo apt install -y build-essential libpq-dev
npm install
```

---

## 6. Create .env File on Server

```bash
nano ~/code/.env
```

Paste:
```dotenv
NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
NEXT_PUBLIC_NHOST_REGION=ap-south-1
NHOST_ADMIN_SECRET=rohanpwd123

IMB_BASE_URL=https://secure-stage.imb.org.in/
IMB_API_TOKEN=fba90ec87cc43a7e62c87304bed8a481
IMB_WEBHOOK_URL=https://coupx.in/api/imb/webhook

NEXT_PUBLIC_SITE_URL=https://coupx.in

TELEGRAM_BOT_TOKEN=8484197801:AAGGI66NunHKEZS11zgcbGlDdnM9hp47Gc0
TELEGRAM_BOT_USERNAME=coupxbot
TELEGRAM_WEBHOOK_DOMAIN=https://bot.coupx.in
```

---

## 7. Build the Bot

```bash
cd ~/code
npm run bot:build
```

---

## 8. Install & Configure PM2

### Install PM2
```bash
sudo npm install -g pm2
```

### Fix: PM2 not found when run with sudo

The issue was that `npm install -g` installs into the NVM path, which sudo doesn't see.

```bash
# Find where PM2 is installed
which pm2

# Create a symlink so sudo can find it (replace path with output of above)
sudo ln -s $(which pm2) /usr/local/bin/pm2
```

### Start the bot with PM2
```bash
cd ~/code
pm2 start dist/bot/index.js --name coupx-bot
```

### Save PM2 process list & enable auto-start on reboot
```bash
pm2 save
pm2 startup
# Run the command it outputs (it gives you a sudo command to copy-paste)
```

### Useful PM2 commands
```bash
pm2 status                   # Check if bot is running
pm2 logs coupx-bot           # View live logs
pm2 logs coupx-bot --lines 100  # View last 100 lines
pm2 restart coupx-bot        # Restart after deploy
pm2 stop coupx-bot           # Stop the bot
pm2 delete coupx-bot         # Remove from PM2
```

---

## 9. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 10. Configure Nginx as Reverse Proxy for Bot Webhook

Telegram webhooks require HTTPS on port 443. Nginx terminates SSL and proxies to the bot running on port 3001.

```bash
sudo nano /etc/nginx/sites-available/bot.coupx.in
```

Paste:
```nginx
server {
    listen 80;
    server_name bot.coupx.in;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and reload:
```bash
sudo ln -s /etc/nginx/sites-available/bot.coupx.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. SSL Certificate with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bot.coupx.in
```

Follow prompts — Certbot auto-edits the Nginx config to add SSL.

Verify auto-renewal works:
```bash
sudo certbot renew --dry-run
```

---

## 12. Open Required Ports (EC2 Security Group)

In AWS Console → EC2 → Security Groups → Inbound Rules, add:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

> Telegram webhooks only work on ports 80, 88, 443, or 8443. We use 443 via Nginx.

---

## 13. Verify Everything is Working

```bash
# Check bot process
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check SSL cert
sudo certbot certificates

# Test the webhook endpoint
curl https://bot.coupx.in/health

# View live bot logs
pm2 logs coupx-bot
```

---

## 14. Deploy Updates (After Code Changes)

```bash
cd ~/code
git pull
npm install          # only if package.json changed
npm run bot:build
pm2 restart coupx-bot
pm2 logs coupx-bot   # confirm no errors
```

---

## Issues Fixed During Setup

### Issue: `npm install` failing with native module errors
```
gyp ERR! find Python
node-pre-gyp ERR! build error
```
**Fix:**
```bash
sudo apt install -y build-essential libpq-dev
npm install
```

### Issue: `whatwg-url` / node_modules corruption
Symptoms: bot crashes with strange module errors even after fixes.
**Fix:**
```bash
rm -rf node_modules
npm install
```

### Issue: `pm2: command not found` when using sudo
**Fix:**
```bash
sudo ln -s $(which pm2) /usr/local/bin/pm2
```

### Issue: Telegram webhook not receiving updates (port refused)
Telegram only allows webhooks on ports 80, 88, 443, 8443.
**Fix:** Set up Nginx as reverse proxy (Step 10) + SSL (Step 11), bot listens on 3001, Nginx forwards from 443.

### Issue: `ECONNREFUSED` — bot calling `localhost` Next.js API that isn't running
The PaymentService was calling `http://localhost:3000/api/imb/create-order`.
**Fix:** Rewrote `bot/services/payment.ts` to call the IMB API directly instead of going through the Next.js route.

### Issue: `IMB_API_TOKEN undefined` at startup
`const IMB_API_TOKEN = process.env.IMB_API_TOKEN` was at module level, running before `dotenv.config()`.
**Fix:** Moved all `process.env` reads inside the methods so they run at call time, not import time.

---

## Directory Structure on Server

```
~/code/
├── .env                  # environment variables (never in git)
├── bot/
│   ├── index.ts          # main bot file
│   ├── types.ts
│   └── services/
│       ├── auth.ts
│       ├── database.ts
│       └── payment.ts
├── dist/                 # compiled output (npm run bot:build)
│   └── bot/
│       └── index.js
└── package.json
```
