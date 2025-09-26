# CI/CD Setup Guide for Imperfect Breath

This guide covers the complete CI/CD setup for automated deployment of your vision service and frontend application.

## 🎯 Overview

Your CI/CD pipeline now includes:

- ✅ **Automated Vision Service Deployment** to Hetzner Cloud
- ✅ **Frontend Deployment** to Netlify (optional)
- ✅ **Nginx Reverse Proxy** for security and load balancing
- ✅ **Health Checks** and integration tests
- ✅ **Firewall Configuration** scripts

## 🚀 Quick Start

### 1. Set up GitHub Secrets

Follow the [GitHub Secrets Setup Guide](./GITHUB_SECRETS_SETUP.md) to configure:

- `HETZNER_SERVER_HOST` (157.180.36.156)
- `HETZNER_SERVER_USER` (root)
- `HETZNER_SSH_PRIVATE_KEY` (your SSH private key)
- `NETLIFY_AUTH_TOKEN` (optional)
- `NETLIFY_SITE_ID` (optional)

### 2. Configure Hetzner Cloud Firewall

```bash
# Install Hetzner CLI and configure
brew install hcloud  # or download from GitHub releases
hcloud context create imperfect-breath

# Run firewall setup script
npm run setup:firewall
```

### 3. Test Your Setup

```bash
# Check deployment status
npm run deploy:status

# Manual deployment (if needed)
npm run deploy:vision
```

## 🔄 CI/CD Workflows

### Vision Service Deployment

**Trigger**: Push to `main` branch with changes in `backend/vision-service/`

**Workflow**: `.github/workflows/deploy-vision-service.yml`

**Steps**:
1. Checkout code
2. Setup SSH connection
3. Deploy to Hetzner server
4. Verify deployment health
5. Report status

### Full Stack Deployment

**Trigger**: Push to `main` branch

**Workflow**: `.github/workflows/deploy-full-stack.yml`

**Steps**:
1. Test frontend (lint, type-check, build)
2. Test backend (dependencies, imports)
3. Deploy backend to Hetzner
4. Deploy frontend to Netlify
5. Run integration tests
6. Report deployment status

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│  Hetzner Cloud  │
│                 │    │                  │    │                 │
│ - Frontend      │    │ - Build & Test   │    │ - Vision Service│
│ - Backend       │    │ - Deploy         │    │ - Nginx Proxy   │
│ - CI/CD Config  │    │ - Health Checks  │    │ - Docker        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │     Netlify      │
                       │                  │
                       │ - Frontend App   │
                       │ - CDN            │
                       │ - SSL/HTTPS      │
                       └──────────────────┘
```

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Deploy Vision | `npm run deploy:vision` | Manual vision service deployment |
| Check Status | `npm run deploy:status` | Comprehensive deployment status check |
| Setup Firewall | `npm run setup:firewall` | Configure Hetzner Cloud firewall |

## 🌐 Service URLs

### Development
- Frontend: `http://localhost:4567`
- Backend: `http://157.180.36.156:8001` (after firewall setup)

### Production
- Frontend: Your Netlify URL
- Backend: `http://157.180.36.156:8001` or `http://157.180.36.156` (via nginx)

## 🔍 Monitoring & Debugging

### Check Service Status

```bash
# Comprehensive status check
npm run deploy:status

# Manual server checks
ssh root@157.180.36.156 "cd /opt/vision-service && sudo docker-compose ps"
ssh root@157.180.36.156 "curl -f http://localhost:8001/health"
```

### View Logs

```bash
# Docker logs
ssh root@157.180.36.156 "cd /opt/vision-service && sudo docker-compose logs -f"

# System logs
ssh root@157.180.36.156 "sudo journalctl -u docker -f"
```

### Common Issues

#### 1. External Access Blocked

**Symptoms**: Internal health check passes, external fails
**Solution**: Configure Hetzner Cloud Firewall

```bash
npm run setup:firewall
```

#### 2. SSH Connection Failed

**Symptoms**: GitHub Actions can't connect to server
**Solution**: Check SSH key configuration

```bash
# Test SSH locally
ssh -i ~/.ssh/github_actions_key root@157.180.36.156

# Check GitHub secrets
# - HETZNER_SSH_PRIVATE_KEY should contain full private key
# - HETZNER_SERVER_HOST should be 157.180.36.156 or snel-bot
```

#### 3. Docker Build Failed

**Symptoms**: Vision service container won't start
**Solution**: Check Docker logs and rebuild

```bash
ssh root@157.180.36.156 "cd /opt/vision-service && sudo docker-compose logs vision-service"
ssh root@157.180.36.156 "cd /opt/vision-service && sudo docker-compose build --no-cache"
```

## 🔐 Security Considerations

### SSH Keys
- ✅ Use dedicated SSH keys for GitHub Actions
- ✅ Limit key access to deployment tasks only
- ✅ Regularly rotate SSH keys

### Firewall
- ✅ Only open necessary ports (22, 80, 443, 8001)
- ✅ Use nginx reverse proxy for additional security
- ✅ Consider IP whitelisting for sensitive endpoints

### Secrets Management
- ✅ Store sensitive data in GitHub Secrets
- ✅ Never commit API keys or private keys
- ✅ Use environment-specific configurations

## 📈 Performance Optimization

### Docker
- ✅ Multi-stage builds for smaller images
- ✅ Resource limits to prevent memory issues
- ✅ Health checks for automatic recovery

### Nginx
- ✅ Rate limiting to prevent abuse
- ✅ Gzip compression for faster responses
- ✅ Security headers for protection

### Monitoring
- ✅ Automated health checks
- ✅ Deployment status reporting
- ✅ Error logging and alerting

## 🚀 Next Steps

1. **Set up SSL/HTTPS**: Add SSL certificates for secure connections
2. **Domain Configuration**: Point a custom domain to your server
3. **Monitoring**: Add application monitoring (e.g., Sentry, DataDog)
4. **Backup Strategy**: Implement automated backups
5. **Scaling**: Consider load balancing for high traffic

## 📞 Support

If you encounter issues:

1. Check the [GitHub Secrets Setup Guide](./GITHUB_SECRETS_SETUP.md)
2. Run `npm run deploy:status` for diagnostics
3. Check GitHub Actions logs for detailed error messages
4. Review server logs via SSH

## 🎉 Success Criteria

Your CI/CD is working correctly when:

- ✅ GitHub Actions deploy without errors
- ✅ `npm run deploy:status` shows all green checkmarks
- ✅ `curl http://157.180.36.156:8001/health` returns healthy status
- ✅ Your frontend can connect to the backend service
- ✅ Vision processing works in production