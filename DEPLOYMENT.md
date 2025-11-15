# NEXDESK Deployment Guide

## ⚠️ Important: Vercel is NOT Recommended

Vercel is designed for static sites and serverless functions. Your NEXDESK project requires:
- ✅ Persistent WebSocket connections
- ✅ Redis for caching and sessions
- ✅ File upload storage
- ✅ Long-running processes
- ✅ Stateful backend server

**Vercel does NOT support these features.**

---

## 🚀 Recommended Deployment Platforms

### Option 1: Railway (Easiest - Recommended)

**Why Railway?**
- ✅ Automatic Docker deployment
- ✅ Built-in Redis support
- ✅ GitHub integration
- ✅ Free tier available
- ✅ Simple environment variable management
- ✅ Automatic HTTPS

**Deployment Steps:**

1. **Push your code to GitHub** (if not already done)

2. **Sign up at [railway.app](https://railway.app)**
   - Use your GitHub account

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your NEXDESK repository

4. **Add Redis Service**
   - In your project, click "New"
   - Select "Database" → "Redis"
   - Railway will automatically provide `REDIS_URL`

5. **Configure Environment Variables**
   Click on your service → Variables → Add these:
   ```
   NODE_ENV=production
   PORT=8001
   MONGO_URL=mongodb+srv://nexdesk:ajay1234@nexusdesk.rag1goi.mongodb.net/nexdesk?retryWrites=true&w=majority
   DB_NAME=nexdesk
   SECRET_KEY=your-super-secure-secret-key-minimum-32-characters-long
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ORIGINS=https://your-railway-domain.railway.app
   RATE_LIMIT_PER_MINUTE=1000
   FRONTEND_URL=https://your-railway-domain.railway.app
   SESSION_SECRET=your-session-secret-minimum-32-characters-long
   ```

6. **Deploy Frontend Separately**
   - Create another service in the same project
   - Select "Deploy from GitHub repo" (same repo)
   - Set build command: `cd frontend && npm install && npm run build`
   - Set start command: `npx serve -s frontend/build -l $PORT`

7. **Get Your URLs**
   - Railway provides automatic domains
   - Update CORS_ORIGINS with your frontend URL

8. **Done!** ✅

**Cost:** Free tier → ~$5-20/month for production

---

### Option 2: Render

**Why Render?**
- ✅ Docker support
- ✅ Free tier with limitations
- ✅ Easy Redis integration
- ✅ Automatic HTTPS
- ✅ GitHub integration

**Deployment Steps:**

1. **Push code to GitHub**

2. **Sign up at [render.com](https://render.com)**

3. **Create Blueprint**
   - New → Blueprint
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

4. **Configure Environment Variables**
   Add in Render dashboard:
   ```
   MONGO_URL=your-mongodb-atlas-url
   SECRET_KEY=your-secret-key
   CORS_ORIGINS=https://your-render-domain.onrender.com
   ```

5. **Deploy**
   - Render will automatically deploy backend, frontend, and Redis
   - Wait for build to complete

6. **Done!** ✅

**Cost:** Free tier (with sleep) → ~$7-25/month

---

### Option 3: DigitalOcean App Platform

**Why DigitalOcean?**
- ✅ Production-ready
- ✅ Excellent performance
- ✅ Docker support
- ✅ Managed databases
- ✅ Scalable

**Deployment Steps:**

1. **Sign up at [digitalocean.com](https://digitalocean.com)**

2. **Create App**
   - Apps → Create App
   - Choose GitHub
   - Select your repository

3. **Configure Components**
   - **Backend:** Dockerfile, Port 8001
   - **Frontend:** Node.js, Build command: `cd frontend && npm run build`
   - **Redis:** Add managed Redis database

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGO_URL=your-mongodb-url
   SECRET_KEY=your-secret-key
   REDIS_URL=${redis.DATABASE_URL}
   CORS_ORIGINS=https://your-app.ondigitalocean.app
   ```

5. **Deploy**

**Cost:** ~$12-25/month

---

### Option 4: Docker on VPS (Most Control)

**Platforms:** DigitalOcean Droplet, Linode, AWS EC2, Google Cloud VM

**Steps:**

1. **Create a VPS** (Ubuntu 22.04 recommended)

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose -y
   ```

4. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/nexdesk.git
   cd nexdesk
   ```

5. **Configure environment**
   ```bash
   cp .env.production .env
   nano .env  # Edit with your values
   ```

6. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

7. **Setup Nginx & SSL**
   ```bash
   apt install nginx certbot python3-certbot-nginx -y
   certbot --nginx -d yourdomain.com
   ```

**Cost:** ~$5-20/month for VPS

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] MongoDB Atlas is set up and accessible
- [ ] Update `.env.production` with production values
- [ ] Change all default passwords and secrets
- [ ] Update CORS_ORIGINS with your production domain
- [ ] Test locally with `docker-compose up`
- [ ] Remove any console.log statements (already done ✅)
- [ ] Security audit passed (already done ✅)
- [ ] GitHub repository is up to date

---

## 🔐 Security Reminders

**Before deploying:**

1. **Change default credentials:**
   - Superadmin password
   - Redis password
   - MongoDB password
   - JWT secret keys

2. **Update environment variables:**
   - Use strong SECRET_KEY (32+ characters)
   - Use strong SESSION_SECRET (32+ characters)
   - Set proper CORS_ORIGINS

3. **Enable SSL/HTTPS:**
   - Most platforms provide this automatically
   - For VPS, use Let's Encrypt (certbot)

---

## 🆘 Need Help?

**Common Issues:**

1. **"Cannot connect to MongoDB"**
   - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for cloud platforms)
   - Verify MONGO_URL is correct

2. **"CORS error"**
   - Update CORS_ORIGINS with your frontend URL
   - Restart backend after changing

3. **"Redis connection failed"**
   - Ensure Redis service is running
   - Check REDIS_URL environment variable

4. **"WebSocket not connecting"**
   - Ensure platform supports WebSockets
   - Check firewall/security group settings

---

## 📊 Monitoring

After deployment, monitor:
- Application logs
- Database performance
- Redis memory usage
- API response times
- Error rates

Most platforms provide built-in monitoring dashboards.

---

## 🎉 Success!

Once deployed, your NEXDESK platform will be accessible at:
- **Frontend:** https://your-domain.com
- **API:** https://your-domain.com/api
- **Health Check:** https://your-domain.com/health

**Login with:**
- Client Code: 031210
- Username: superadmin
- Password: superadmin123 (change immediately!)

---

**Questions?** Check platform-specific documentation or create an issue on GitHub.
