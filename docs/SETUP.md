# Setup Guide

Complete setup instructions for developers and contributors.

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-username/imperfect-breath.git
cd imperfect-breath
npm install

# Start development
npm run dev  # Frontend only
# OR
npm run dev:full  # With backend services
```

## Development Environment

### Frontend Only (Recommended)
```bash
npm run dev
# Opens http://localhost:4556
# Works with all core features + fallback AI
```

### Full Stack (Optional)
```bash
# Terminal 1: Backend services
cd backend/vision-service
pip install -r requirements.txt
MODEL_DOWNLOAD_ON_START=false python3 main.py

# Terminal 2: Frontend
npm run dev
```

## Environment Variables

### Required (None)
The app works immediately without any configuration.

### Optional Enhancements
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_HETZNER_SERVICE_URL=https://api.imperfectform.fun
```

## Production Deployment

### Netlify (Frontend)
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables (optional)

### Hetzner (Backend)
```bash
# Deploy to server
ssh your-server
cd /path/to/app
docker-compose up -d
```

## Testing

```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run lint          # Code quality
npm run type-check    # TypeScript validation
```

## Common Issues

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist .vite
npm install
npm run build
```

### Backend Connection Issues
```bash
# Check backend health
curl http://localhost:8001/health
# Should return: {"status": "healthy"}
```

### Camera Not Working
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try different browser

## Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run dev:full      # Start with backend
npm run preview       # Preview production build

# Building
npm run build         # Production build
npm run build:analyze # Bundle analysis

# Quality
npm run lint          # ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
npm run type-check    # TypeScript check

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Project Structure

```
imperfect-breath/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utilities & services
│   ├── stores/        # State management
│   └── styles/        # CSS & themes
├── backend/
│   └── vision-service/ # Python backend
├── docs/              # Documentation
└── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test: `npm test`
4. Submit pull request

## Security

- Never commit API keys
- Use environment variables for secrets
- Run security scan: `npm run security-check`
- Report issues via GitHub Issues

## Support

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Live Demo**: [imperfectbreath.netlify.app](https://imperfectbreath.netlify.app)
