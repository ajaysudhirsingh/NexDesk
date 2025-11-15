# 🔧 Fix: "craco: not found" Error on Render

## The Problem

You're seeing this error during frontend deployment:
```
npm error command sh -c craco build
sh: craco: not found
```

## The Solution

The build command needs to install **devDependencies** (which includes craco).

---

## ✅ Quick Fix

### If you're deploying manually:

1. **Go to your Frontend service** in Render dashboard
2. **Click "Settings"** (left sidebar)
3. **Find "Build Command"**
4. **Change it to:**
   ```bash
   cd frontend && npm install --include=dev && npm run build
   ```
5. **Click "Save Changes"**
6. **Render will automatically redeploy**
7. **Wait 3-5 minutes** - Check logs for success

---

### If you're using render.yaml (Blueprint):

The `render.yaml` file has been updated with the correct command. Just:

1. **Commit and push the changes:**
   ```bash
   git add render.yaml
   git commit -m "Fix frontend build command"
   git push origin main
   ```

2. **Render will automatically redeploy**

---

## Why This Happens

- `craco` is listed in `devDependencies` in `frontend/package.json`
- By default, some build systems skip devDependencies
- The `--include=dev` flag ensures devDependencies are installed
- This gives us access to `craco` for the build process

---

## ✅ Verify It's Fixed

After redeploying, check the logs. You should see:

```
✓ Successfully built frontend
✓ Build completed
✓ Deploy live
```

---

## 🎉 Success!

Your frontend should now build successfully and be live at:
```
https://nexdesk-frontend-xxxx.onrender.com
```

---

## Still Having Issues?

### Check the logs:
1. Go to your frontend service in Render
2. Click "Logs" (left sidebar)
3. Look for any error messages

### Common issues:

**"Out of memory"**
- Free tier has limited memory
- Try: Clear cache and redeploy
- Settings → Manual Deploy → Clear build cache & deploy

**"Build timeout"**
- Free tier has 15-minute build limit
- Usually completes in 3-5 minutes
- If timing out, try redeploying

**"Module not found"**
- Make sure all dependencies are in package.json
- Try: Clear cache and redeploy

---

## Need More Help?

- Check `START_HERE.md` for complete deployment guide
- Check `RENDER_DEPLOY.md` for detailed instructions
- Review Render logs for specific error messages

---

**The fix is simple: just add `--include=dev` to the build command!** ✅
