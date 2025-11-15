# ✅ Render Deployment Checklist

## Before You Start

- [ ] Code is pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] MongoDB allows connections from anywhere (0.0.0.0/0)

---

## Step 1: Deploy Backend API

1. [ ] Go to https://render.com
2. [ ] Sign up with GitHub
3. [ ] New + → Web Service
4. [ ] Connect your repository
5. [ ] Configure:
   - Name: `nexdesk-api`
   - Environment: `Node`
   - Build Command: `cd api && npm install`
   - Start Command: `cd api && npm start`
   - Plan: `Free`

6. [ ] Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URL=mongodb+srv://nexdesk:ajay1234@nexusdesk.rag1goi.mongodb.net/nexdesk?retryWrites=true&w=majority
   DB_NAME=nexdesk
   SECRET_KEY=change-this-to-random-32-chars
   SESSION_SECRET=change-this-to-random-32-chars
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   RATE_LIMIT_PER_MINUTE=100
   LOG_LEVEL=info
   ```

7. [ ] Click "Create Web Service"
8. [ ] Wait for "Live" status
9. [ ] Copy your API URL (e.g., `https://nexdesk-api.onrender.com`)

---

## Step 2: Deploy Frontend

1. [ ] New + → Static Site
2. [ ] Connect same repository
3. [ ] Configure:
   - Name: `nexdesk-frontend`
   - Build Command: `cd frontend && npm install --include=dev && npm run build`
   - Publish Directory: `frontend/build`
   - Plan: `Free`

4. [ ] Add Environment Variable:
   ```
   REACT_APP_BACKEND_URL=https://nexdesk-api.onrender.com
   ```
   (Use YOUR actual API URL from Step 1)

5. [ ] Click "Create Static Site"
6. [ ] Wait for "Live" status
7. [ ] Copy your Frontend URL (e.g., `https://nexdesk-frontend.onrender.com`)

---

## Step 3: Update CORS

1. [ ] Go back to Backend API service
2. [ ] Environment tab
3. [ ] Add/Update:
   ```
   CORS_ORIGINS=https://nexdesk-frontend.onrender.com
   FRONTEND_URL=https://nexdesk-frontend.onrender.com
   ```
   (Use YOUR actual Frontend URL from Step 2)

4. [ ] Save Changes (auto-redeploys)

---

## Step 4: Test

1. [ ] Open your frontend URL
2. [ ] See login page
3. [ ] Login with:
   - Client Code: `031210`
   - Username: `superadmin`
   - Password: `superadmin123`
4. [ ] Set up 2FA
5. [ ] Access dashboard

---

## 🎉 Done!

Your NEXDESK is live at:
- Frontend: https://nexdesk-frontend.onrender.com
- API: https://nexdesk-api.onrender.com

---

## ⚠️ Important Notes

**Free Tier:**
- Services sleep after 15 min inactivity
- First load after sleep takes 30-60 seconds
- This is normal!

**Security:**
- Change superadmin password immediately
- Update SECRET_KEY and SESSION_SECRET to random strings
- Enable 2FA for all admin accounts

---

## 🆘 Troubleshooting

**Can't connect to database?**
→ MongoDB Atlas → Network Access → Allow 0.0.0.0/0

**CORS error?**
→ Check CORS_ORIGINS matches frontend URL exactly

**Slow first load?**
→ Normal for free tier (service waking up)

**Build failed?**
→ Check logs in Render dashboard

---

## 📞 Need Help?

Read full guide: `RENDER_DEPLOY.md`
