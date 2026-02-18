# CoupX Telegram Bot - Production Deployment Guide

## 🚀 Quick Answer - For AWS Users

**Good news: You have AWS Free Tier with $100 credits!**

**Best options for you (in order of cost):**

1. **EC2 t2.micro** - **100% FREE** (free tier, 750 hours/month = 24/7)
2. **EC2 t3.micro Spot** - **~$1.50/month** (70% cheaper than on-demand)
3. **AWS Fargate Spot + Docker** - **~$2-3/month** (you know Docker!)
4. **Lightsail** - $3.50/month (simplest but not free)

**Recommended: Use EC2 t2.micro (FREE) until Aug 2026, then switch to Spot**

**Full setup:** See "AWS Free Tier Setup" below (5 minutes).

---

## Alternative: Railway (No AWS Knowledge Needed)

If you want even simpler (but need new account):
- Visit Railway.app → Deploy from GitHub → Done in 5 minutes
- Auto HTTPS, auto deploy, $5 free credit/month

---

## 📖 Full Guide

The bot is **production-ready** and works on multiple platforms. Choose what fits you best:

## ⚠️ Vercel Limitation Warning

**Your Telegram bot CANNOT run on Vercel** because:
- Vercel only supports serverless functions (max 60s execution)
- The bot needs a long-running Node.js process
- Background workers aren't supported

**Solution:** Deploy Next.js on Vercel + Bot on Railway/Render

## 📋 Prerequisites

1. **Vercel Account** - For your Next.js app (you already have this)
2. **Railway/Render Account** - For your Telegram bot (free tier available)
3. **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
4. **Nhost Account** with your database credentials

## 🔧 Environment Variables

Create a `.env` file on your production server:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_DOMAIN=https://yourdomain.com

# Server Port (optional, defaults to 3001)
PORT=3001

# Nhost Database
NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
NEXT_PUBLIC_NHOST_REGION=ap-south-1
NHOST_ADMIN_SECRET=your_nhost_admin_secret

# Website
NEXT_PUBLIC_SITE_URL=https://coupx.in
```

## 🎯 How It Works

### Development Mode (Current)
- ✅ No webhook domain set
- ✅ Uses polling mode (bot asks Telegram for updates)
- ✅ Works on localhost
- ⚠️ Not recommended for production

### Production Mode (Automatic)
- ✅ Webhook domain set → automatically uses webhooks
- ✅ Telegram sends updates to your server
- ✅ More efficient and reliable
- ✅ Supports multiple instances

## 📦 Deployment Options

### ⭐ Option 1: AWS EC2 Free Tier (100% FREE - Recommended for You!)

**You have free tier + $100 credits = Perfect for your bot!**

**EC2 t3.micro Specs:**
- ✅ **Free for 12 months** (750 hours/month = 24/7)
- ✅ 2 vCPUs, 1GB RAM (better than t2.micro!)
- ✅ Your credits cover it until Aug 2026
- ✅ After free tier: Switch to Spot (~$1.50/month)

**5-Minute Setup:**

1. **Launch EC2 Instance:**
   - Go to AWS Console → EC2 → Launch Instance
   - Name: `coupx-telegram-bot`
   - AMI: **Ubuntu Server 24.04 LTS** (Free tier eligible)
   - Instance type: **t3.micro** (Free tier eligible)
   - Key pair: Create new or select existing
   - Network: Default VPC
   - **Security Group - Add rules:**
     - SSH (22) - **0.0.0.0/0** (Anywhere - If your IP changes frequently)
     - OR SSH (22) - **My IP** (More secure - If you have static IP)
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - Custom TCP (3001) - Anywhere (for testing)
   - Storage: 8GB (free tier includes up to 30GB)
   - Click **Launch Instance**
   
   **⚠️ IMPORTANT: Allocate Elastic IP immediately:**
   - Go to EC2 → Elastic IPs → Allocate
   - Associate with your instance
   - Use this IP for all connections (prevents disconnections when your public IP changes)

2. **Connect via SSH:**
   ```bash
   # Windows (PowerShell)
   ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
   
   # If permission denied, fix key permissions first:
   icacls "your-key.pem" /inheritance:r
   icacls "your-key.pem" /grant:r "%username%:R"
   ```
   
   **⚠️ IMPORTANT - Prevent Disconnections:**
   ```bash
   # Keep SSH connection alive (prevent timeouts)
   # Add this to your SSH config on Windows:
   # File: C:\Users\YourUsername\.ssh\config
   
   Host ec2-*
       ServerAliveInterval 60
       ServerAliveCountMax 10
       TCPKeepAlive yes
   
   # Or connect with keep-alive flags:
   ssh -i "your-key.pem" -o ServerAliveInterval=60 ubuntu@your-ec2-ip
   ```

3. **Install everything:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20 (Ubuntu 24.04 compatible)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2, Nginx, Certbot, Git
   sudo npm install -g pm2
   sudo apt install -y nginx certbot python3-certbot-nginx git
   
   # Clone your repo
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   npm install
   ```

4. **Create `.env` file:**
   ```bash
   nano .env
   ```
   
   Paste:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
   NHOST_ADMIN_SECRET=your_nhost_admin_secret
   NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
   NEXT_PUBLIC_NHOST_REGION=ap-south-1
   NEXT_PUBLIC_SITE_URL=https://coupx.in
   ```
   
   Save: `Ctrl+X`, `Y`, `Enter`

5. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/coupx-bot
   ```
   
   Paste:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or use EC2 public IP
       
       location /telegram-webhook/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
       
       location /health {
           proxy_pass http://localhost:3001/health;
       }
   }
   ```
   
   Enable and test:
   ```bash
   sudo ln -s /etc/nginx/sites-available/coupx-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL (if using custom domain):**
   ```bash
   # Point your domain to EC2 Elastic IP first
   sudo certbot --nginx -d your-domain.com
   
   # Auto-renewal
   sudo certbot renew --dry-run
   ```
   
   **Don't have a domain?** Use Cloudflare Tunnel (free) or just use HTTP for testing.

7. **Start bot with PM2:**
   ```bash
   cd ~/your-repo
   pm2 start npm --name "coupx-bot" -- run bot:start
   pm2 startup
   pm2 save
   pm2 logs coupx-bot  # Check logs
   ```

8. **Test:**
   ```bash
   curl http://your-elastic-ip/health
   # Should return: {"status":"ok","mode":"webhook"}
   ```

**Cost: $0/month (Elastic IP is free while instance is running)**

---

### Option 2: AWS Fargate Spot + Docker (You Know Docker!)

**Perfect if you want Docker - ~$2-3/month with Spot pricing**

1. **Create `Dockerfile` in project root:**

   ```dockerfile
   FROM node:20-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   
   # Copy app files
   COPY . .
   
   # Expose port
   EXPOSE 3001
   
   # Start bot
   CMD ["npm", "run", "bot:start"]
   ```

2. **Create `.dockerignore`:**
   ```
   node_modules
   npm-debug.log
   .env
   .git
   .next
   dist
   ```

3. **Build and push to ECR:**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com
   
   # Create repository
   aws ecr create-repository --repository-name coupx-bot --region ap-south-1
   
   # Build image
   docker build -t coupx-bot .
   
   # Tag image
   docker tag coupx-bot:latest <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/coupx-bot:latest
   
   # Push image
   docker push <your-account-id>.dkr.ecr.ap-south-1.amazonaws.com/coupx-bot:latest
   ```

4. **Create ECS Cluster:**
   - Go to ECS Console → Create Cluster
   - Name: `coupx-cluster`
   - Infrastructure: AWS Fargate
   - Create

5. **Create Task Definition:**
   - Go to Task Definitions → Create new
   - Family: `coupx-bot-task`
   - Infrastructure: AWS Fargate
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Container:
     - Name: `coupx-bot`
     - Image: `<your-ecr-image-uri>`
     - Port: 3001
     - Environment variables: Add all your env vars
   - Create

6. **Create Service with Spot:**
   - Go to your cluster → Services → Create
   - Launch type: Fargate
   - Capacity provider: **FARGATE_SPOT** (70% cheaper!)
   - Task definition: Select your task
   - Service name: `coupx-bot-service`
   - Desired tasks: 1
   - Load balancer: Application Load Balancer (for HTTPS)
   - Create

7. **Setup ALB for webhook:**
   - Create Application Load Balancer
   - Configure HTTPS listener
   - Point to your ECS service

**Cost: ~$2-3/month with Fargate Spot**

---

### Option 3: EC2 Spot Instance (Cheapest After Free Tier)

**After your free tier ends, use Spot for ~$1.50/month**

Same setup as EC2 t2.micro above, but:
- Select **t3.micro Spot** instead of t2.micro
- 70% cheaper than on-demand
- Rare interruptions (bot restarts automatically)

**Cost: ~$1.50/month**

---

### Option 4: AWS Lightsail (Simplest)

**Perfect for bots - $3.50/month, simple setup:**

1. **Create Lightsail Instance:**
   - Go to AWS Console → Lightsail
   - Create Instance → OS Only → Ubuntu 22.04
   - Choose $3.50/month plan (1GB RAM)
   - Name: `coupx-telegram-bot`

2. **SSH into your instance** (use browser-based SSH or terminal)

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

4. **Clone and setup your bot:**
   ```bash
   git clone <your-repo-url>
   cd coupx
   npm install
   ```

5. **Create `.env` file:**
   ```bash
   nano .env
   ```
   
   Add:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_WEBHOOK_DOMAIN=https://your-lightsail-ip-or-domain.com
   NHOST_ADMIN_SECRET=your_nhost_admin_secret
   NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
   NEXT_PUBLIC_NHOST_REGION=ap-south-1
   NEXT_PUBLIC_SITE_URL=https://coupx.in
   ```
   
   Save: `Ctrl+X`, `Y`, `Enter`

6. **Install and configure Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

7. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/coupx-bot
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or use Lightsail IP
       
       location /telegram-webhook/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /health {
           proxy_pass http://localhost:3001/health;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/coupx-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL with Let's Encrypt:**
   ```bash
   # If using custom domain
   sudo certbot --nginx -d your-domain.com
   
   # If using Lightsail static IP, use self-signed cert
   # Or set up Cloudflare for free SSL
   ```

9. **Start bot with PM2:**
   ```bash
   cd ~/coupx
   pm2 start npm --name "coupx-bot" -- run bot:start
   pm2 startup
   pm2 save
   ```

10. **Configure Lightsail Firewall:**
    - Go to Lightsail instance → Networking
    - Add rule: TCP, Port 443 (HTTPS)
    - Add rule: TCP, Port 80 (HTTP)

**Cost:** $3.50/month (first 6 months free with AWS credits)

#### AWS EC2 (More Control)

**Similar to Lightsail but more flexible:**

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04
   - Type: t2.micro (free tier eligible)
   - Security Group: Allow ports 22, 80, 443
   - Create/select key pair

2. **Follow same steps as Lightsail** (steps 2-9 above)

3. **Allocate Elastic IP** (optional but recommended):
   - EC2 Console → Elastic IPs → Allocate
   - Associate with your instance

**Cost:** Free tier (1 year), then ~$8/month

#### AWS ECS Fargate (Advanced - Containerized)

**For Docker users:**

1. **Create Dockerfile** in your project:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3001
   CMD ["npm", "run", "bot:start"]
   ```

2. **Push to ECR and deploy with Fargate**
   - Build and push Docker image to ECR
   - Create ECS cluster
   - Create Fargate task definition
   - Create service

### 🆚 Quick Comparison

| Option | Cost (Your Situation) | Ease of Use | Best For |
|--------|----------------------|-------------|----------|
| **EC2 t3.micro** | **FREE until Aug 2026** | ⭐⭐⭐⭐ | You have free tier + credits |
| **EC2 Spot** | **$1.50/mo** | ⭐⭐⭐ | After free tier ends |
| **Fargate Spot + Docker** | **$2-3/mo** | ⭐⭐⭐ | You know Docker, want containers |
| **Lightsail** | $3.50/mo | ⭐⭐⭐⭐⭐ | Simplest AWS option |
| **Railway** | $5 credit/mo | ⭐⭐⭐⭐⭐ | No AWS, instant deploy |

**My Recommendation for You:**
1. **Now → Aug 2026:** Use EC2 t3.micro (FREE) with Ubuntu 24.04 LTS
2. **After Aug 2026:** Switch to EC2 t3.micro Spot ($1.50/month)
3. **Alternative:** Fargate Spot if you prefer Docker ($2-3/month)

---

### Option 4: AWS Lightsail (Simplest AWS, but Not Free)

**Same as original guide** - $3.50/month VPS with simple setup.

See Lightsail instructions earlier in this document if you prefer simplicity over cost.

---

### Option 5: Railway (Non-AWS, Super Easy)

**For those who want zero server management:**

**Railway Deployment (5 minutes):**

1. **Create Railway Account**: https://railway.app (free $5/month credit)

2. **New Project** → **Deploy from GitHub**
   - Select your repository
   - Railway will detect your code

3. **Configure Build Settings:**
   - Root directory: `/` (leave blank)
   - Build command: `npm install`
   - Start command: `npm run bot:start`
   - Port: Will auto-detect from code (3001)

4. **Add Environment Variables** in Railway dashboard:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_WEBHOOK_DOMAIN=https://your-app-name.up.railway.app
   NHOST_ADMIN_SECRET=your_nhost_admin_secret
   NEXT_PUBLIC_NHOST_SUBDOMAIN=tiujfdwdudfhfoqnzhxl
   NEXT_PUBLIC_NHOST_REGION=ap-south-1
   NEXT_PUBLIC_SITE_URL=https://coupx.in
   ```
   
   ⚠️ **Important:** `TELEGRAM_WEBHOOK_DOMAIN` should be your Railway domain (provided after first deploy)

5. **Deploy** - Railway will:
   - Install dependencies
   - Start your bot with `npm run bot:start`
   - Provide HTTPS domain automatically
   - Set up webhook automatically

6. **Verify Deployment:**
   ```bash
   curl https://your-app-name.up.railway.app/health
   # Should return: {"status":"ok","mode":"webhook"}
   ```

**Railway Benefits:**
- ✅ Free $5/month credit (enough for bot)
- ✅ HTTPS provided automatically
- ✅ Easy GitHub auto-deploy
- ✅ Built-in logs and monitoring
- ✅ No credit card required for free tier
- ✅ Perfect for long-running processes

---

### Option 6: Render (Free with Cold Starts)

**Render is similar to Railway but with always-free tier (spins down after 15 min inactivity)**

1. **Create Render Account**: https://render.com

2. **New** → **Web Service**
   - Connect GitHub repo
   - Name: `coupx-telegram-bot`
   - Build command: `npm install`
   - Start command: `npm run bot:start`

3. **Environment Variables** (same as Railway above)

4. **Deploy** ✅

**Render Free Tier:**
- ✅ Completely free
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold starts (slow first response)

### Option 3: DigitalOcean/AWS/Linode (Advanced)

```bash
# 1. Clone your repo
git clone your-repo-url
cd coupx

# 2. Install dependencies
npm install

# 3. Create .env file
nano .env
# (add your environment variables)

# 4. Install PM2 for process management
npm install -g pm2

# 5. Start bot
pm2 start npm --name "coupx-bot" -- run bot:start

# 6. Auto-restart on server reboot
pm2 startup
pm2 save

# 7. Monitor logs
pm2 logs coupx-bot
```

### Option 3: DigitalOcean/AWS/Linode (Advanced)

**For advanced users who want full control:**

```bash
# 1. Clone your repo
git clone your-repo-url
cd coupx

# 2. Install dependencies
npm install

# 3. Create .env file
nano .env
# (add your environment variables)

# 4. Install PM2 for process management
npm install -g pm2

# 5. Start bot
pm2 start npm --name "coupx-bot" -- run bot:start

# 6. Auto-restart on server reboot
pm2 startup
pm2 save

# 7. Monitor logs
pm2 logs coupx-bot
```

### Option 4: All-on-Vercel (Advanced - Not Recommended)

**For developers who want everything on Vercel:**

This requires converting the bot to use Next.js API routes instead of a standalone server. This is **more complex** and has trade-offs.

I can help you set this up if needed, but **Railway/Render is easier and more reliable**.

## 🔐 SSL/HTTPS Setup

**Railway/Render:** HTTPS provided automatically ✅ (Nothing to do!)

**Custom VPS only:** Use Nginx + Let's Encrypt (see advanced section below)

## ✅ Verification Checklist

After deploying to Railway/Render:

1. **Check bot is running**
   ```bash
   # Replace with your Railway/Render domain
   curl https://your-app-name.up.railway.app/health
   # Should return: {"status":"ok","mode":"webhook"}
   ```

2. **Verify webhook is set**
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   # Should show your webhook URL
   ```

3. **Test bot**
   - Open Telegram
   - Send `/start` to your bot
   - Should receive welcome message instantly

4. **Check Railway/Render logs**
   - Look for "Webhook server running"
   - Check for any errors

## 🔄 Updating Your Bot

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart bot
pm2 restart coupx-bot

# Or on Railway/Heroku: Just push to GitHub
```

## 🐛 Troubleshooting

### AWS-Specific Issues

**SSH keeps disconnecting / Cannot reconnect (VSCode shows "Connecting..."):**

This is usually caused by **dynamic IP changes**. Your ISP assigns you a new IP, blocking SSH access.

**Diagnosis:**
```bash
# Check your current public IP
curl ifconfig.me

# Compare with Security Group SSH rule in AWS Console
```

**Solution 1: Use Elastic IP (Recommended - Free)**
1. AWS Console → EC2 → Elastic IPs → Allocate
2. Associate with your instance
3. Use Elastic IP instead of public IP
4. AWS Console → Security Group → SSH rule: Set to **0.0.0.0/0** (for dynamic IPs) or **Your current IP/32** (for static)

**Solution 2: Allow SSH from Anywhere (Less Secure)**
```bash
# AWS Console → Security Groups → Edit inbound rules
# SSH (22): Source = 0.0.0.0/0 (Anywhere IPv4)
# This allows SSH from any IP but is less secure
```

**Solution 3: Use AWS Session Manager (No SSH needed)**
```bash
# Install AWS CLI and Session Manager plugin
# Then connect without SSH:
aws ssm start-session --target i-your-instance-id

# No port 22 or public IP needed!
```

**Fix VSCode Remote SSH timeout:**
1. Create/edit: `C:\Users\YourUsername\.ssh\config`
2. Add:
   ```
   Host ec2-*
       ServerAliveInterval 60
       ServerAliveCountMax 10
       TCPKeepAlive yes
       ConnectTimeout 60
   ```

**Bot not responding:**
```bash
# Check if bot is running
pm2 status

# Check logs
pm2 logs coupx-bot

# Restart bot
pm2 restart coupx-bot
```

**Cannot connect to server:**
- Check Lightsail/EC2 firewall rules (ports 80, 443 open)
- Verify Security Group allows inbound traffic
- Test: `curl http://your-ip/health`

**Webhook not working:**
- Telegram requires HTTPS
- Check SSL certificate: `sudo certbot certificates`
- Verify Nginx config: `sudo nginx -t`
- Check webhook info: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

**Out of memory:**
```bash
# Check memory usage
free -h

# Upgrade Lightsail plan or optimize code
# Or add swap:
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### General Bot Errors
- Check logs: `pm2 logs coupx-bot` or Railway/Heroku logs
- Verify webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check environment variables are set correctly

### Webhook errors
- Ensure HTTPS (not HTTP)
- Verify domain is accessible publicly
- Check firewall allows incoming connections on port 443

### Database errors
- Verify NHOST_ADMIN_SECRET is correct
- Check Nhost subdomain and region
- Ensure database is running

## 📱 Monitoring

### PM2 (VPS deployments)
```bash
# View status
pm2 status

# View logs
pm2 logs coupx-bot

# Restart
pm2 restart coupx-bot

# Stop
pm2 stop coupx-bot
```

### Railway/Heroku
- Check logs in dashboard
- Monitor resource usage
- Set up alerts

## 🔄 Session Management

⚠️ **Current setup uses in-memory sessions** (will be lost on restart).

For production, use Redis:

```bash
npm install ioredis
```

Then update `bot/index.ts`:

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Replace sessions Map with Redis
function getSession(userId: number): UserSession {
  const key = `session:${userId}`
  // Implement Redis get/set
}
```

## 💡 Best Practices

1. **Environment Variables**: Never commit `.env` to Git
2. **Monitoring**: Set up uptime monitoring (UptimeRobot, Pingdom)
3. **Backups**: Regular database backups
4. **Logs**: Keep logs for debugging
5. **Updates**: Keep dependencies updated
6. **Security**: Keep NHOST_ADMIN_SECRET and BOT_TOKEN secret

## 🎉 Summary

**For AWS Users with Free Tier (YOU!):**

**Perfect Setup for Your Situation:**
```bash
# 🎯 NOW: Use EC2 t2.micro (FREE)
# ✅ You have: $100 credits + Free tier until Aug 2026
# ✅ Cost: $0/month
# ✅ Setup time: 10 minutes

# After August 2026, choose:
# Option A: Switch to EC2 t3.micro Spot ($1.50/month)
# Option B: Keep regular EC2 t2.micro (~$8/month, covered by new free tier if you start fresh)
```

**Quick Deploy to EC2 Free Tier (10 minutes):**
```bash
# 1. Launch EC2 t3.micro Ubuntu 24.04 LTS instance (Free tier eligible)
# 2. Configure Security Group (ports 22, 80, 443)
# 3. SSH into instance
# 4. Run:

# Update system first
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 & tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx git
sudo npm install -g pm2

# Clone and setup
git clone <your-repo>
cd <your-repo>
npm install
nano .env  # Add environment variables

# Configure Nginx (see detailed guide above)
sudo nano /etc/nginx/sites-available/coupx-bot
sudo ln -s /etc/nginx/sites-available/coupx-bot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Start bot
pm2 start npm --name "coupx-bot" -- run bot:start
pm2 startup && pm2 save

# Test
curl http://your-ec2-ip/health

# Setup SSL if using domain
sudo certbot --nginx -d yourdomain.com
```

**OR for Docker Users:**
- Use Fargate Spot (~$2-3/month) - See Option 2 above

---

### AWS Cost Breakdown (Your Situation)

**Current (Feb 2026 - Aug 2026):**
- ✅ **EC2 t3.micro:** $0/month (Free tier)
- ✅ **Data transfer:** $0/month (1GB/month free)
- ✅ **EBS Storage:** $0/month (30GB free)
- ✅ **Ubuntu 24.04 LTS:** Fully supported
- ✅ **Total:** **$0/month**

**After Free Tier (Sep 2026+):**
| Option | Monthly Cost | Best For |
|--------|--------------|----------|
| **EC2 t3.micro Spot** (Recommended) | **$1.50** | Cheapest option |
| EC2 t3.micro on-demand | $8.50 | More stable |
| Fargate Spot + Docker | $2-3 | You know Docker |
| Lightsail | $3.50 | Simplest AWS |

**Recommendation: Use free EC2 t3.micro (Ubuntu 24.04) now, switch to Spot after Aug 2026**

---

**For Non-AWS Users:**

1. ✅ Go to Railway.app
2. ✅ Deploy from GitHub
3. ✅ Add environment variables  
4. ✅ Deploy (Done in 5 minutes)

---

## 📊 Final Recommendation

**Based on your situation:**

✅ **You have:** AWS account with $100 credits + Free tier  
✅ **You know:** Docker  
✅ **You want:** Cheapest option  

**Your path:**

1. **Today → Aug 2026** (6 months):
   - Deploy to **EC2 t3.micro** (100% FREE)
   - Use free tier 750 hours/month
   - Ubuntu 24.04 LTS
   - Cost: **$0**

2. **After Aug 2026**:
   - Switch to **EC2 t3.micro Spot** (70% cheaper)
   - Cost: **~$1.50/month**
   - Or switch to **Fargate Spot + Docker** if you prefer: **$2-3/month**

3. **Alternative** (if you don't want to manage servers):
   - Railway: $5 credit/month (auto-deploys, no management)

**Best value = EC2 t3.micro (free) → EC2 Spot ($1.50/mo)**

---

**The bot will automatically:**
- ✅ Use webhooks if `TELEGRAM_WEBHOOK_DOMAIN` is set
- ✅ Fall back to polling in development
- ✅ Handle all user interactions
- ✅ Connect to your Nhost database

**Need help with setup?** All commands are in the detailed guides above!
