# 🚂 Railway Deployment Guide

## 📋 Quick Steps to Deploy to Railway

### **Step 1: Prepare Your Repository**

1. **Make sure your backend is ready:**
   - ✅ `main.py` has production settings
   - ✅ `requirements.txt` exists
   - ✅ `Procfile` exists
   - ✅ `runtime.txt` exists

2. **Commit your changes:**
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### **Step 2: Deploy to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository** (smart-sort)
6. **Select the backend folder** or deploy the whole repo
7. **Click "Deploy"**

### **Step 3: Configure Environment Variables**

After deployment, go to your Railway project dashboard:

1. **Click on your deployed service**
2. **Go to "Variables" tab**
3. **Add these environment variables:**

```
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=smart_waste_segregation
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### **Step 4: Get Your Railway URL**

1. **In Railway dashboard**, click on your service
2. **Copy the generated URL** (e.g., `https://your-app-name.railway.app`)
3. **This is your production backend URL**

### **Step 5: Update Mobile App**

1. **Update `SmartWasteSortApp/src/config/api.js`:**
```javascript
// Change this line:
const CURRENT_ENV = ENV.PRODUCTION;

// Update the production URL:
const API_URLS = {
  [ENV.DEVELOPMENT]: 'http://192.168.0.101:5000',
  [ENV.PRODUCTION]: 'https://your-app-name.railway.app', // Your Railway URL
  [ENV.STAGING]: 'https://your-staging-backend.railway.app',
};
```

2. **Build new APK:**
```bash
cd SmartWasteSortApp
npx react-native run-android --variant=release
```

## 🔧 Railway-Specific Features

### **Automatic Deployments**
- Railway automatically deploys when you push to GitHub
- No manual deployment needed

### **Environment Variables**
- Set them in Railway dashboard
- Secure and encrypted

### **Custom Domains**
- Add custom domain in Railway dashboard
- SSL certificates included

### **Monitoring**
- View logs in Railway dashboard
- Monitor performance and errors

## 🚨 Troubleshooting

### **Issue 1: Build Fails**
- Check if all dependencies are in `requirements.txt`
- Ensure `main.py` has correct production settings

### **Issue 2: App Crashes**
- Check Railway logs in dashboard
- Verify environment variables are set

### **Issue 3: Database Connection**
- Use MongoDB Atlas for cloud database
- Update `MONGODB_URI` in Railway variables

### **Issue 4: CORS Errors**
- Railway automatically handles CORS
- If issues persist, check your CORS configuration

## 🎉 Success Checklist

- [ ] Backend deployed to Railway
- [ ] Environment variables configured
- [ ] Railway URL obtained
- [ ] Mobile app updated with Railway URL
- [ ] New APK built and tested
- [ ] All features working on Railway

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Check logs** in Railway dashboard for debugging

**Your app is now deployed and ready to work without your local computer!** 🚂 