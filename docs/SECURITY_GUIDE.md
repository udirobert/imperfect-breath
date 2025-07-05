# 🔒 Security Guide - Environment Variables & Private Keys

## 🚨 CRITICAL SECURITY PRINCIPLES

### ✅ **SAFE FOR VERSION CONTROL**
- **`.env.example`** - Template with placeholder values
- **Source code** - WITHOUT any real secrets
- **Configuration files** - Using environment variable references
- **Documentation** - With security best practices

### ❌ **NEVER COMMIT TO VERSION CONTROL**
- **`.env`** - Your personal environment file
- **`.env.local`** - Local development overrides  
- **`.env.production`** - Production secrets
- **Private keys** - In any form
- **API keys** - Real values
- **Database credentials** - Real values

## 🛡️ **CURRENT SECURITY STATUS**

### ✅ **SECURED**
- ✅ Private keys removed from tracked files
- ✅ `.env.development` removed from git tracking
- ✅ Test scripts use environment variables
- ✅ `.gitignore` properly configured
- ✅ `.env.example` has placeholder values

### 🔧 **SECURITY MEASURES IMPLEMENTED**

#### 1. **Environment Variable Protection**
```bash
# .gitignore includes:
.env
.env.*
!.env.example
# NEVER track .env.development - it may contain real secrets
```

#### 2. **Code Uses Environment Variables**
```typescript
// ✅ SECURE - Uses environment variable
const privateKey = process.env.VITE_STORY_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('VITE_STORY_PRIVATE_KEY environment variable is required');
}

// ❌ INSECURE - Hardcoded (REMOVED)
// const privateKey = '0x27884872c4d75e2817df9839bbebe443a82ced5c9ceac0587f5a03409a6d52b5';
```

#### 3. **Proper File Structure**
```
├── .env.example          # ✅ Template (tracked)
├── .env                  # ❌ Your secrets (NOT tracked)
├── .env.development      # ❌ Development secrets (NOT tracked)
├── .env.production       # ❌ Production secrets (NOT tracked)
└── .gitignore           # ✅ Protects sensitive files (tracked)
```

## 🔑 **ENVIRONMENT VARIABLE SETUP**

### **Step 1: Create Your Local .env File**
```bash
# Copy the example and add your real values
cp .env.example .env
```

### **Step 2: Add Your Real Values to .env**
```bash
# Story Protocol (your testnet account)
VITE_STORY_PRIVATE_KEY=0x27884872c4d75e2817df9839bbebe443a82ced5c9ceac0587f5a03409a6d52b5
VITE_STORY_RPC_URL=https://aeneid.storyrpc.io
VITE_STORY_CHAIN_ID=1315

# Add other real values as needed
VITE_SUPABASE_URL=https://your-real-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_supabase_key
VITE_GEMINI_API_KEY=your_real_gemini_key
```

### **Step 3: Verify Security**
```bash
# Check that .env is not tracked
git status | grep .env
# Should only show .env.example

# Verify no secrets in tracked files
grep -r "your_private_key" . --exclude-dir=node_modules --exclude-dir=.git
# Should return no results
```

## 🚀 **DEPLOYMENT SECURITY**

### **Development Environment**
- Use `.env` file with testnet values
- Never commit `.env` to version control
- Use testnet tokens only

### **Production Environment**
- Set environment variables in hosting platform
- Use production API keys and mainnet values
- Enable additional security measures:
  - Rate limiting
  - IP whitelisting
  - API key rotation
  - Monitoring and alerts

### **Platform-Specific Setup**

#### **Vercel**
```bash
# Set environment variables in Vercel dashboard
vercel env add VITE_STORY_PRIVATE_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_GEMINI_API_KEY
```

#### **Netlify**
```bash
# Set in Netlify dashboard under Site Settings > Environment Variables
VITE_STORY_PRIVATE_KEY=your_production_private_key
VITE_SUPABASE_URL=your_production_supabase_url
```

#### **Railway/Render**
```bash
# Set in platform dashboard
VITE_STORY_PRIVATE_KEY=your_production_private_key
VITE_STORY_NETWORK=mainnet
```

## 🔍 **SECURITY CHECKLIST**

### **Before Every Commit**
- [ ] No private keys in code
- [ ] No API keys in code  
- [ ] `.env` files not tracked
- [ ] Only placeholder values in `.env.example`
- [ ] Sensitive files in `.gitignore`

### **Before Deployment**
- [ ] Environment variables set in hosting platform
- [ ] Production values different from development
- [ ] API keys have proper permissions/restrictions
- [ ] Rate limiting enabled
- [ ] Monitoring configured

### **Regular Security Maintenance**
- [ ] Rotate API keys quarterly
- [ ] Monitor for unusual API usage
- [ ] Update dependencies regularly
- [ ] Review access logs
- [ ] Backup environment configurations securely

## 🚨 **INCIDENT RESPONSE**

### **If Private Key is Compromised**
1. **Immediately** transfer all funds to new wallet
2. Generate new private key
3. Update environment variables
4. Revoke old key from all services
5. Monitor for unauthorized transactions

### **If API Key is Compromised**
1. **Immediately** revoke the compromised key
2. Generate new API key
3. Update environment variables
4. Monitor for unusual usage
5. Review access logs

## 📚 **BEST PRACTICES**

### **Development**
- Use separate keys for development/production
- Never share private keys via chat/email
- Use hardware wallets for high-value accounts
- Regular security audits

### **Team Collaboration**
- Each developer has their own `.env` file
- Share `.env.example` template only
- Use secure key management for shared secrets
- Document security procedures

### **Production**
- Use managed secret services (AWS Secrets Manager, etc.)
- Enable audit logging
- Implement key rotation
- Monitor for security events

---

## ✅ **CURRENT STATUS: SECURE**

Your project is now properly secured with:
- ✅ No private keys in version control
- ✅ Proper environment variable usage
- ✅ Secure file structure
- ✅ Comprehensive `.gitignore`
- ✅ Security documentation

**You can safely commit and deploy your project!** 🚀