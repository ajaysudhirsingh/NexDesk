# 🚀 Deploy NEXDESK on Render - START HERE

## You're seeing Docker errors? That's OK!

**For Render free tier, you DON'T need Docker.** Follow these steps instead:

---

## 📋 Quick Setup (10 minutes)

### Step 1: Prepare MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Sign in (or create free account)
3. Click **"Network Access"** (left sidebar)
4. Click **"Add IP Address"**
5. Click **"Allow Access from Anywhere"**
6. Enter: `0.0.0.0/0`
7. Click **"Confirm"**

✅ Done! MongoDB is ready.

---

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for Render"
git push origin main
```

✅ Code is on GitHub.

---

### Step 3: Deploy Backend on Render

1. **Go to:** https://render.com
2. **Sign up** with GitHub (free)
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect account"** → Authorize Render
5. Find your NEXDESK repository → Click **"Connect"**

6. **Fill in these settings:**
   ```
   Name: nexdesk-api
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave blank)
   Environment: Node
   Build Command: cd api && npm install
   Start Command: cd api && npm start
   Instance Type: Free
   ```

7. **Scroll down to "Environment Variables"**
   
   Click **"Add Environment Variable"** and add these ONE BY ONE:

   ```
   NODE_ENV = production
   PORT = 10000
   MONGO_URL = mongodb+srv://nexdesk:ajay1234@nexusdesk.rag1goi.mongodb.net/nexdesk?retryWrites=true&w=majority
   DB_NAME = nexdesk
   SECRET_KEY = my-super-secret-key-change-this-later-32-characters-minimum
   SESSION_SECRET = another-secret-key-change-this-later-32-characters-minimum
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   RATE_LIMIT_PER_MINUTE = 100
   LOG_LEVEL = info
   ```

8. Click **"Create Web Service"**

9. **WAIT** (5-10 minutes) - Watch the logs, wait for "Live" ✅

10. **COPY YOUR API URL** - It looks like:
    ```
    https://nexdesk-api-xxxx.onrender.com
    ```
    **SAVE THIS!** You need it for the next step.

---

### Step 4: Deploy Frontend on Render

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect the **SAME repository** again
3. Click **"Connect"**

4. **Fill in these settings:**
   ```
   Name: nexdesk-frontend
   Branch: main
   Root Directory: (leave blank)
   Build Command: cd frontend && npm install --include=dev && npm run build
   Publish Directory: frontend/build
   ```

5. **Add Environment Variable:**
   
   Click **"Advanced"** → **"Add Environment Variable"**
   
   ```
   REACT_APP_BACKEND_URL = https://nexdesk-api-xxxx.onrender.com
   ```
   
   ⚠️ **IMPORTANT:** Replace `nexdesk-api-xxxx.onrender.com` with YOUR actual API URL from Step 3!

6. Click **"Create Static Site"**

7. **WAIT** (3-5 minutes) - Wait for "Live" ✅

8. **COPY YOUR FRONTEND URL** - It looks like:
   ```
   https://nexdesk-frontend-xxxx.onrender.com
   ```

---

### Step 5: Update Backend CORS

1. Go back to your **Backend API** service in Render
2. Click **"Environment"** (left sidebar)
3. Click **"Add Environment Variable"** and add:

   ```
   CORS_ORIGINS = https://nexdesk-frontend-xxxx.onrender.com
   FRONTEND_URL = https://nexdesk-frontend-xxxx.onrender.com
   ```
   
   ⚠️ **IMPORTANT:** Use YOUR actual frontend URL from Step 4!

4. Click **"Save Changes"**
5. Render will automatically redeploy (wait 2-3 minutes)

---

### Step 6: Test Your App! 🎉

1. **Open your frontend URL** in browser
2. You should see the **NEXDESK login page**
3. **Login with:**
   ```
   Client Code: 031210
   Username: superadmin
   Password: superadmin123
   ```
4. **Set up Google Authenticator** (2FA)
5. **You're in!** 🎊

---

## ✅ Success Checklist

- [ ] MongoDB Atlas allows 0.0.0.0/0
- [ ] Backend shows "Live" in Render
- [ ] Frontend shows "Live" in Render
- [ ] CORS_ORIGINS matches frontend URL
- [ ] REACT_APP_BACKEND_URL matches backend URL
- [ ] Can see login page
- [ ] Can login successfully

---

## ⚠️ Common Issues

### "Cannot connect to database"
**Fix:** MongoDB Atlas → Network Access → Add 0.0.0.0/0

### "CORS error" in browser
**Fix:** 
1. Check backend environment variables
2. Make sure CORS_ORIGINS exactly matches your frontend URL
3. Include `https://` in the URL
4. Save and wait for redeploy

### "Service Unavailable" or slow first load
**Fix:** This is normal for free tier! Service is waking up from sleep. Wait 30-60 seconds and refresh.

### Build fails
**Fix:** Check the logs in Render dashboard. Usually it's a missing environment variable.

---

## 🎉 You're Live!

Your NEXDESK is now accessible at:
- **Frontend:** https://nexdesk-frontend-xxxx.onrender.com
- **API:** https://nexdesk-api-xxxx.onrender.com/health

---

## 🔐 Important: Change Passwords!

After first login:
1. Change superadmin password
2. Update SECRET_KEY to a random string
3. Update SESSION_SECRET to a random string
4. Set up 2FA for all admin accounts

---

## 💡 Free Tier Notes

- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- This is completely normal for free tier
- Perfect for testing and demos!

---

## 🆘 Still Having Issues?

1. Check Render logs (click on service → Logs)
2. Check browser console (F12 → Console tab)
3. Verify all URLs are correct
4. Make sure MongoDB allows all IPs

---

**Need more help?** Read the full guide in `RENDER_DEPLOY.md`

**Happy deploying! 🚀**
