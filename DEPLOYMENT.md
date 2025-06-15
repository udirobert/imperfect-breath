# 🚀 Deployment Guide - Breath Flow Vision

## Quick Netlify Deployment

### 1. **One-Click Deploy**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-repo/breath-flow-vision)

### 2. **Manual Deployment**

#### **Prerequisites**
- GitHub account
- Netlify account (free)
- Node.js 18+ installed locally

#### **Steps**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for hackathon deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Environment Variables** (Optional)
   In Netlify dashboard → Site settings → Environment variables:
   ```
   VITE_ENABLE_MOCK_MODE=true
   VITE_APP_ENV=production
   VITE_DEBUG_MODE=false
   ```

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://your-site-name.netlify.app`

---

## 🎯 Hackathon Demo Setup

### **Demo Mode Features**
- ✅ **No wallet required** - Story Protocol integration runs in demo mode
- ✅ **Mock IP registration** - Shows full flow without blockchain transactions
- ✅ **Camera permissions** - Works with browser camera for face tracking
- ✅ **AI analysis** - Requires API keys but has fallback messaging

### **For Judges/Reviewers**
1. **Visit the deployed site**
2. **Try the complete flow:**
   - Choose a breathing pattern
   - Click "Setup Camera & Begin"
   - Enable camera (allow permissions)
   - Start breathing session
   - Complete session and view results
   - Click "Register as IP Asset" (demo mode)
   - Try AI analysis (optional - requires API keys)

### **Demo Data**
The app includes:
- Pre-built breathing patterns (4-7-8, Box Breathing, etc.)
- Mock session data for testing
- Demo IP registration with console logging
- Sample AI analysis responses

---

## 🔧 Configuration Options

### **Environment Variables**

#### **Required for Full Functionality**
```bash
# AI Providers (optional but recommended for full demo)
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key

# Story Protocol (demo mode works without these)
VITE_STORY_PROTOCOL_API_KEY=your_story_key
VITE_STORY_PROTOCOL_CHAIN_ID=11155111
```

#### **Demo Mode (Default)**
```bash
VITE_ENABLE_MOCK_MODE=true
VITE_ENABLE_IP_REGISTRATION=true
VITE_APP_ENV=production
```

### **Build Optimization**
The `netlify.toml` includes:
- Automatic SPA routing
- Security headers
- Camera permission policies
- Asset caching
- Build optimization

---

## 📱 Mobile Deployment

### **PWA Features**
- Responsive design works on mobile
- Camera access on mobile browsers
- Touch-friendly interface
- Offline-capable (service worker ready)

### **Mobile Testing**
- iOS Safari: ✅ Camera works
- Android Chrome: ✅ Camera works
- Mobile Firefox: ✅ Camera works

---

## 🚨 Troubleshooting

### **Common Issues**

#### **Camera Not Working**
- Ensure HTTPS deployment (Netlify provides this)
- Check browser permissions
- Verify CSP headers allow camera access

#### **Build Failures**
```bash
# Clear cache and rebuild
npm run build:dev
```

#### **Story SDK Issues**
- Demo mode bypasses wallet requirements
- Check console for IP registration logs
- Verify environment variables

### **Debug Mode**
Set `VITE_DEBUG_MODE=true` for detailed console logging.

---

## 🏆 Hackathon Submission Checklist

### **✅ Technical Requirements**
- [x] Story Protocol SDK integrated
- [x] IP registration functionality
- [x] Clean, responsive UI
- [x] Working demo mode
- [x] Mobile-friendly

### **✅ Deployment Ready**
- [x] `netlify.toml` configured
- [x] Build optimization enabled
- [x] Security headers set
- [x] SPA routing configured
- [x] Environment variables documented

### **✅ Demo Ready**
- [x] No wallet required for demo
- [x] Camera permissions work
- [x] IP registration demo functional
- [x] AI analysis available
- [x] Complete user flow working

---

## 🌐 Live Demo

**Deployed URL:** `https://breath-flow-vision.netlify.app`

**Test Flow:**
1. Choose "4-7-8 Breathing" pattern
2. Click "Setup Camera & Begin"
3. Allow camera permissions
4. Complete a 2-minute session
5. Register session as IP asset
6. View AI analysis (if configured)

**Expected Result:**
- Smooth breathing session with face tracking
- IP asset registration with mock transaction ID
- Session analytics and insights
- Professional, polished user experience

---

## 📞 Support

For deployment issues:
- Check Netlify build logs
- Verify environment variables
- Test locally with `npm run build && npm run preview`
- Review browser console for errors

**The app is ready for hackathon submission! 🚀**
