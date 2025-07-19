# AI Integration Setup Guide

## Phase 2: AI Integration Completion

This guide helps you configure the AI providers for the enhanced breathing analysis system.

## Environment Variables Setup

Add the following environment variables to your `.env` file:

```bash
# Google Gemini AI (Primary Provider)
VITE_GOOGLE_AI_API_KEY=AIza...your_google_api_key_here

# OpenAI GPT-4 (Secondary Provider)
VITE_OPENAI_API_KEY=sk-...your_openai_api_key_here

# Anthropic Claude (Tertiary Provider)
VITE_ANTHROPIC_API_KEY=sk-ant-...your_anthropic_api_key_here
```

## Getting API Keys

### 1. Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Note: Requires billing setup for GPT-4 access

### 3. Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in to your Anthropic account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

## Testing the Integration

Run the AI integration test to verify all providers are working:

```bash
npm run test:ai
```

This will test:
- ✅ AI Analysis with all configured providers
- ✅ Pattern Generation capabilities
- ✅ Response time and reliability
- ✅ JSON parsing and validation

## Provider Priorities

The system will use providers in this order:
1. **Google Gemini** - Primary (fastest, most cost-effective)
2. **OpenAI GPT-4** - Secondary (high quality analysis)
3. **Anthropic Claude** - Tertiary (thoughtful insights)

## Minimum Requirements

- At least **1 provider** must be configured for basic functionality
- **2+ providers** recommended for redundancy and failover
- **All 3 providers** optimal for comprehensive analysis

## Features Enabled with Multiple Providers

- **Multi-provider analysis** - Get insights from different AI perspectives
- **Automatic failover** - If one provider fails, others continue working
- **Comparative analysis** - Compare different AI approaches to breathing analysis
- **Enhanced pattern generation** - AI-powered custom breathing patterns

## Cost Considerations

| Provider | Cost Level | Best For |
|----------|------------|----------|
| Google Gemini | Low | Regular analysis, high volume |
| OpenAI GPT-4 | Medium | Detailed analysis, special cases |
| Anthropic Claude | Medium | Thoughtful recommendations |

## Troubleshooting

### Common Issues

1. **"No API key configured"**
   - Check environment variable names match exactly
   - Ensure `.env` file is in project root
   - Restart development server after adding keys

2. **"Invalid API key"**
   - Verify key is copied correctly (no extra spaces)
   - Check key hasn't expired
   - Ensure billing is set up (for paid providers)

3. **"Network error"**
   - Check internet connection
   - Verify firewall/proxy settings
   - Try again after a few minutes

### Testing Individual Providers

Test specific providers:

```bash
# Test only Gemini
VITE_OPENAI_API_KEY="" VITE_ANTHROPIC_API_KEY="" npm run test:ai

# Test only OpenAI
VITE_GOOGLE_AI_API_KEY="" VITE_ANTHROPIC_API_KEY="" npm run test:ai

# Test only Anthropic
VITE_GOOGLE_AI_API_KEY="" VITE_OPENAI_API_KEY="" npm run test:ai
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all API keys
3. **Rotate keys regularly** (monthly recommended)
4. **Monitor usage** to detect unauthorized access
5. **Set usage limits** where possible

## Phase 2 Completion Checklist

- [ ] At least one AI provider configured and working
- [ ] `npm run test:ai` passes successfully
- [ ] Enhanced useAIAnalysis hook functioning
- [ ] Multi-provider support implemented
- [ ] Pattern generation working
- [ ] Fallback mechanisms in place

## Next Steps

Once Phase 2 is complete, proceed to:
- **Phase 3**: Lens Protocol V3 Integration
- **Phase 4**: Story Protocol IP Registration
- **Phase 5**: Flow Blockchain Integration

## Support

If you encounter issues:
1. Check the test output for specific error messages
2. Verify API keys are valid and have sufficient credits
3. Review the console for detailed error logs
4. Ensure all dependencies are installed (`npm install`)