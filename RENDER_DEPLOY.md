# 🚀 Deploy NEXDESK on Render (FREE)

## Step-by-Step Guide for Free Deployment

---

## 📋 Prerequisites

1. ✅ Code pushed to GitHub
2. ✅ MongoDB Atlas account (free tier)
3. ✅ Render account (we'll create this)

---

## 🎯 Deployment Steps

### Step 1: Prepare MongoDB Atlas

1. **Go to:** https://cloud.mongodb.com
2. **Sign in** or create account
3. **Network Access** → **Add IP Address**
   - Click "Allow Access from Anywhere"
   - Add IP: `0.0.0.0/0`
   - Click "Confirm"
4. **Copy your connection string** (you'll need this)

---

### Step 2: Push Code to GitHub

```bash
# If not already done
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

### Step 3: Create Render Account

1. **Go to:** https://render.com
2. **Click:** "Get Started for Free"
3. **Sign up** with your GitHub account
4. **Authorize** Render to access your repositories

---

### Step 4: Deploy Backend API

1. **In Render Dashboard:**
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Find and select your NEXDESK repository
   - Click **"Connect"**

3. **Configure Service:**
   ```
   Name: nexdesk-api
   Region: Choose closest to you
   Branch: main
   Root Directory: (leave empty)
   Environment: Node
   Build Command: cd api && npm install
   Start Command: cd api && npm start
   Plan: Free
   ```

4. **Add Environment Variables:**
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these one by one:
   
   ```env
   NODE_ENV=production
   PORT=10000
   MONGO_URL=mongodb+srv://nexdesk:ajay1234@nexusdesk.rag1goi.mongodb.net/nexdesk?retryWrites=true&w=majority
   DB_NAME=nexdesk
   SECRET_KEY=your-super-secure-random-string-minimum-32-characters-long-change-this
   SESSION_SECRET=another-super-secure-random-string-minimum-32-characters-change-this
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   RATE_LIMIT_PER_MINUTE=100
   LOG_LEVEL=info
   ```

5. **Click:** "Create Web Service"

6. **Wait for deployment** (5-10 minutes)
   - You'll see build logs
   - Wait for "Live" status

7. **Copy your API URL:**
   - It will be like: `https://nexdesk-api.onrender.com`
   - Save this for next step

---

### Step 5: Deploy Frontend

1. **In Render Dashboard:**
   - Click **"New +"** → **"Static Site"**

2. **Connect Repository:**
   - Select your NEXDESK repository again
   - Click **"Connect"**

3. **Configure Static Site:**
   ```
   Name: nexdesk-frontend
   Branch: main
   Root Directory: (leave empty)
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/build
   Plan: Free
   ```

4. **Add Environment Variables:**
   Click **"Advanced"** → **"Add Environment Variable"**
   
   ```env
   REACT_APP_API_URL=https://nexdesk-api.onrender.com
   ```
   
   ⚠️ **Replace** `nexdesk-api.onrender.com` with YOUR actual API URL from Step 4

5. **Click:** "Create Static Site"

6. **Wait for deployment** (3-5 minutes)

7. **Copy your Frontend URL:**
   - It will be like: `https://nexdesk-frontend.onrender.com`

---

### Step 6: Update Backend CORS

1. **Go back to your API service** in Render
2. **Click:** "Environment"
3. **Add/Update these variables:**
   ```env
   CORS_ORIGINS=https://nexdesk-frontend.onrender.com
   FRONTEND_URL=https://nexdesk-frontend.onrender.com
   ```
   
   ⚠️ **Replace** with YOUR actual frontend URL from Step 5

4. **Click:** "Save Changes"
5. Render will automatically redeploy

---

### Step 7: Update Frontend API URL

1. **Go to your Frontend service** in Render
2. **Click:** "Environment"
3. **Update:**
   ```env
   REACT_APP_API_URL=https://nexdesk-api.onrender.com
   ```
   
   ⚠️ Make sure this matches your actual API URL

4. **Click:** "Save Changes"
5. Render will automatically redeploy

---

### Step 8: Test Your Deployment

1. **Open your frontend URL** in browser
2. **You should see the login page**
3. **Login with:**
   ```
   Client Code: 031210
   Username: superadmin
   Password: superadmin123
   ```
4. **Set up Google Authenticator** (2FA)
5. **Change your password immediately!**

---

## ✅ Success Checklist

- [ ] Backend API is "Live" in Render
- [ ] Frontend is "Live" in Render
- [ ] MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- [ ] CORS_ORIGINS matches your frontend URL
- [ ] REACT_APP_API_URL matches your backend URL
- [ ] Can access login page
- [ ] Can login with superadmin credentials
- [ ] 2FA setup works

---

## 🎉 You're Live!

Your NEXDESK is now deployed and accessible at:
- **Frontend:** https://nexdesk-frontend.onrender.com
- **API:** https://nexdesk-api.onrender.com/health

---

## ⚠️ Free Tier Limitations

**Important to know:**

1. **Services spin down after 15 minutes of inactivity**
   - First request after inactivity takes 30-60 seconds
   - This is normal for free tier

2. **750 hours/month free**
   - Enough for testing and small projects
   - Services may sleep if not used

3. **No Redis on free tier**
   - App works without Redis
   - Some caching features disabled

4. **Build time limits**
   - Builds must complete in 15 minutes
   - Usually takes 5-10 minutes

---

## 🔧 Troubleshooting

### "Cannot connect to database"
**Solution:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Allow access from anywhere: `0.0.0.0/0`
4. Wait 2-3 minutes for changes to apply

### "CORS error" in browser console
**Solution:**
1. Check backend environment variables
2. Make sure `CORS_ORIGINS` matches your frontend URL exactly
3. Include `https://` in the URL
4. Save and wait for redeploy

### "Service Unavailable" or slow first load
**Solution:**
- This is normal for free tier
- Service is waking up from sleep
- Wait 30-60 seconds and refresh

### Frontend shows blank page
**Solution:**
1. Check browser console for errors
2. Verify `REACT_APP_API_URL` is correct
3. Make sure API is "Live" in Render
4. Check API health: `https://your-api-url.onrender.com/health`

### Build fails
**Solution:**
1. Check build logs in Render
2. Make sure all dependencies are in package.json
3. Try manual deploy: Dashboard → Manual Deploy → Deploy latest commit

---

## 🔐 Security Recommendations

**After deployment:**

1. **Change default passwords:**
   ```bash
   # Login and change:
   - Superadmin password
   - MongoDB password (in Atlas)
   ```

2. **Update secret keys:**
   - Generate new SECRET_KEY (32+ random characters)
   - Generate new SESSION_SECRET (32+ random characters)
   - Update in Render environment variables

3. **Enable 2FA:**
   - Set up Google Authenticator for superadmin
   - Required on first login

4. **Monitor access:**
   - Check Render logs regularly
   - Monitor MongoDB Atlas metrics

---

## 📊 Monitoring Your App

**In Render Dashboard:**
- View real-time logs
- Check service status
- Monitor bandwidth usage
- See deployment history

**In MongoDB Atlas:**
- Monitor database connections
- Check query performance
- View storage usage

---

## 💰 Upgrade Options

**When you're ready to upgrade:**

| Feature | Free | Starter ($7/mo) | Pro ($25/mo) |
|---------|------|-----------------|--------------|
| Always On | ❌ | ✅ | ✅ |
| Custom Domain | ❌ | ✅ | ✅ |
| Redis | ❌ | ✅ | ✅ |
| More Resources | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

---

## 🆘 Need Help?

**Resources:**
- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Check service logs in Render dashboard
- Review browser console for frontend errors

---

## 🎊 Congratulations!

Your NEXDESK platform is now live and accessible worldwide on Render's free tier!

**Next Steps:**
1. Create your first tenant/client
2. Add team members
3. Start managing tickets
4. Explore all features

**Enjoy your enterprise-grade IT management platform! 🚀**
