# Domain Setup Guide - Imperfect Breath

This guide helps you configure a custom domain for your Imperfect Breath application using GoDaddy DNS.

## 🎯 Multi-Project Domain Structure

Using **`imperfectform.fun`** (already has full protection) to serve multiple projects:

| Subdomain | Purpose | Points To | SSL | Status |
|-----------|---------|-----------|-----|--------|
| `imperfectform.fun` | Your existing project | Current setup | ✅ | **Keep as-is** |
| `api.imperfectform.fun` | Imperfect Breath Vision API | 157.180.36.156 | ✅ | **New addition** |
| `breath.imperfectform.fun` | Imperfect Breath Frontend | Netlify (optional) | ✅ | **Optional** |

### Benefits of This Approach:
- ✅ Your existing project remains untouched
- ✅ Clean API endpoint for Imperfect Breath
- ✅ Professional subdomain structure
- ✅ Easy to manage and scale

## 🔧 GoDaddy DNS Configuration

### Step 1: Access GoDaddy DNS Management

1. Go to [GoDaddy DNS Management](https://dcc.godaddy.com/manage/dns)
2. Select **`imperfectform.fun`**
3. Click **"Manage DNS"**

### Step 2: Add DNS Records

**IMPORTANT**: Only add the NEW records below. Don't modify your existing `imperfectform.fun` setup.

Add these DNS records:

| Type | Name | Value | TTL | Notes |
|------|------|-------|-----|-------|
| A | api | 157.180.36.156 | 600 | **New** - For Imperfect Breath API |
| CNAME | breath | your-netlify-site.netlify.app | 600 | **Optional** - For Imperfect Breath frontend |

**Leave existing records unchanged** - your current `imperfectform.fun` setup should remain as-is.

### Step 3: Root Domain Configuration

**Option A: Redirect to App**
- Add A record: `@` → `157.180.36.156`
- Configure nginx to redirect to `app.imperfectform.fun`

**Option B: Point to Netlify**
- Add A records for Netlify's load balancer IPs:
  - `@` → `75.2.60.5`
  - `@` → `99.83.190.102`
  - `@` → `198.185.159.144`
  - `@` → `198.185.159.145`

## 🔒 SSL Certificate Setup

### Option 1: Let's Encrypt (Free, Recommended)

I'll create an automated SSL setup script for your server.

### Option 2: Cloudflare (Free SSL + CDN)

Alternative approach using Cloudflare as a proxy.

## 🚀 Implementation

Let me update your configuration files to support the custom domain.