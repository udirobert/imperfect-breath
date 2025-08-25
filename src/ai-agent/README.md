# Zen AI Agent Integration

This directory contains the Zen AI Breathing Coach components that can be integrated with various AI frameworks.

## 🤖 Components

### `zen-character.json`
Complete character definition for Zen, including:
- Personality and knowledge base
- Conversation examples and style
- Breathing expertise and blockchain knowledge
- Ready for use with Eliza, OpenAI, or custom AI frameworks

### `breathing-pattern-plugin/`
Custom plugin with 5 core actions:
- **Create Pattern**: Generate personalized breathing patterns
- **Analyze Session**: Provide feedback on breathing sessions
- **Mint NFT**: Convert patterns to blockchain assets
- **Share Social**: Share patterns on Lens Protocol
- **Recommend**: Suggest optimal patterns for users

## 🚀 Integration Options

### Option 1: Eliza Framework (Full AI Agent)
```bash
# Set up Eliza agent (if needed)
git clone https://github.com/ai16z/eliza.git zen-agent
cd zen-agent
pnpm install

# Copy our components
cp ../zen-character.json ./characters/
cp -r ../breathing-pattern-plugin ./packages/

# Configure and start
pnpm start --character="./characters/zen-character.json"
```

### Option 2: OpenAI Integration (API-based)
```typescript
import { ZenVisionCoach } from '@/lib/vision';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const zenCoach = ZenVisionCoach.getInstance();

async function getZenResponse(userMessage: string, visionMetrics?: VisionMetrics) {
  const systemPrompt = `You are Zen, an AI Breathing Coach...`; // From character file
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  });
  
  // Enhance with vision coaching if available
  if (visionMetrics) {
    const coaching = await zenCoach.analyzeAndCoach(visionMetrics, pattern, duration);
    return coaching.message;
  }
  
  return response.choices[0].message.content;
}
```

### Option 3: Custom Integration
```typescript
import { BreathingPatternPlugin } from './breathing-pattern-plugin';

class CustomZenAgent {
  private plugin = new BreathingPatternPlugin();
  
  async processMessage(message: string, context: any) {
    // Use the plugin actions directly
    if (message.includes('create pattern')) {
      return await this.plugin.createBreathingPattern(context);
    }
    
    if (message.includes('mint NFT')) {
      return await this.plugin.mintPatternNFT(context);
    }
    
    // Add your custom logic here
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# AI Provider
OPENAI_API_KEY=your_openai_key
GOOGLE_GEMINI_API_KEY=your_gemini_key

# Blockchain Integration
FLOW_PRIVATE_KEY=your_flow_key
LENS_API_KEY=your_lens_key

# Vision System
ENABLE_VISION_COACHING=true
```

### Plugin Configuration
```typescript
// Update breathing-pattern-plugin/src/index.ts
// Replace simulation functions with real blockchain calls:

// Replace simulateMintNFT with:
const flowClient = new EnhancedFlowClient();
const result = await flowClient.mintBreathingNFT(pattern);

// Replace simulateSocialShare with:
const lensClient = new LensClient();
const result = await lensClient.sharePattern(pattern);
```

## 🎯 Next Steps

1. **Choose Integration Method**: Eliza for full agent, OpenAI for API, or custom
2. **Add API Keys**: Configure environment variables
3. **Connect Blockchain**: Replace simulation with real calls
4. **Test Integration**: Use the test scripts to verify functionality
5. **Deploy**: Set up production environment

## 📝 Notes

- The character definition is framework-agnostic
- Plugin actions can be used independently
- Vision system integration is ready
- All blockchain simulation functions need real implementation
- Test scripts are available for validation

This modular approach allows you to integrate Zen into any AI framework while maintaining the breathing expertise and blockchain capabilities.
