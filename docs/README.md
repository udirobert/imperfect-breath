# Imperfect Breath - Documentation Hub

## 🎯 **Quick Start**

### **Development**
```bash
npm install
npm run dev
```

### **Production Deployment**
```bash
# Check deployment status
npm run deploy

# Deploy vision service
npm run deploy:vision

# Configure domain & SSL
npm run deploy:domain

# Configure firewall
npm run deploy:firewall
```

## 📚 **Documentation**

| Document | Purpose |
|----------|---------|
| [CI/CD Setup](./CI_CD_SETUP.md) | Complete deployment pipeline guide |
| [Domain Setup](./DOMAIN_SETUP.md) | Custom domain configuration |
| [GitHub Secrets](./GITHUB_SECRETS_SETUP.md) | Automated deployment setup |
| [Progress Summary](./PROGRESS_SUMMARY.md) | Current project status |
| [Roadmap](./ROADMAP.md) | Future development plans |

## 🏗️ **Architecture**

```
Frontend (React/TypeScript) → API (api.imperfectform.fun) → Vision Service (Hetzner)
     ↓                              ↓                           ↓
  Netlify/Vercel              Nginx + SSL                Docker + FastAPI
     ↓                              ↓                           ↓
  Web3 Integration            Rate Limiting              MediaPipe + AI
```

## 🚀 **Core Features**

- **Vision Processing**: Real-time face detection and breathing analysis
- **AI Analysis**: Advanced breathing pattern insights
- **Web3 Integration**: Flow blockchain and Lens Protocol
- **Professional API**: SSL-secured domain with rate limiting
- **Automated CI/CD**: GitHub Actions deployment pipeline

## 🔧 **Development Commands**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run deploy` | Check deployment status |
| `npm run setup` | Install dependencies |

## 🌐 **Production URLs**

- **Frontend**: Your Netlify deployment
- **API**: https://api.imperfectform.fun
- **Health Check**: https://api.imperfectform.fun/health

## 📋 **Prerequisites**

- Node.js 18+
- Docker (for local vision service)
- Hetzner Cloud account
- GoDaddy domain management
- GitHub repository access

## 🔐 **Security**

- SSL/TLS encryption
- Rate limiting
- CORS protection
- Environment variable isolation
- SSH key authentication

## 📞 **Support**

For issues or questions:
1. Check the documentation in `/docs/`
2. Run `npm run deploy` for diagnostics
3. Review GitHub Actions logs
4. Check server logs via SSH

---

**Built with**: React, TypeScript, FastAPI, MediaPipe, Docker, Nginx