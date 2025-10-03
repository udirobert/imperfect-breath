# RevenueCat Backend Configuration

This document explains how to configure RevenueCat API keys on your Hetzner backend server.

## 🔐 **Security Overview**

RevenueCat API keys are now handled securely:
- ❌ **Before**: Keys exposed in client-side JavaScript bundle
- ✅ **Now**: Keys stored server-side, fetched via API when needed

## 🚀 **Backend Setup**

### **1. SSH into your Hetzner server**
```bash
ssh snel-bot
```

### **2. Set environment variables**
```bash
# Add to your environment (e.g., ~/.bashrc, systemd service, or Docker env)
export REVENUECAT_IOS_KEY="appl_YOUR_IOS_KEY_HERE"
export REVENUECAT_ANDROID_KEY="goog_YOUR_ANDROID_KEY_HERE"
```

### **3. For systemd service (recommended)**
```bash
# Edit your service file
sudo nano /etc/systemd/system/vision-service.service

# Add environment variables:
[Service]
Environment="REVENUECAT_IOS_KEY=appl_YOUR_IOS_KEY_HERE"
Environment="REVENUECAT_ANDROID_KEY=goog_YOUR_ANDROID_KEY_HERE"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart vision-service
```

### **4. For Docker deployment**
```bash
# Add to your docker-compose.yml or run command
docker run -e REVENUECAT_IOS_KEY="appl_YOUR_IOS_KEY_HERE" \
           -e REVENUECAT_ANDROID_KEY="goog_YOUR_ANDROID_KEY_HERE" \
           your-vision-service
```

## 🧪 **Testing**

### **1. Check if backend is configured**
```bash
curl https://your-backend-url/api/config/revenuecat/status
```

### **2. Test configuration endpoint**
```bash
curl https://your-backend-url/api/config/revenuecat
```

## 🔄 **Frontend Integration**

The frontend will automatically:
1. ✅ Try to fetch RevenueCat config from backend
2. ✅ Fall back gracefully if not available
3. ✅ Show "upgrade to premium" messaging when RevenueCat is unavailable

## 📝 **API Endpoints**

### **GET /api/config/revenuecat**
Returns RevenueCat configuration:
```json
{
  "ios": "appl_...",
  "android": "goog_...",
  "available": true
}
```

### **GET /api/config/revenuecat/status**
Returns configuration status:
```json
{
  "ios_configured": true,
  "android_configured": true,
  "available": true,
  "message": "RevenueCat configuration status"
}
```

## 🎯 **Benefits**

- ✅ **Secure**: Keys never exposed in client code
- ✅ **Flexible**: Easy to enable/disable RevenueCat
- ✅ **Graceful**: App works without RevenueCat
- ✅ **Scalable**: Ready for production deployment
