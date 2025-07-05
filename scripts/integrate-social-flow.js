#!/usr/bin/env node

/**
 * Quick Social Integration Script
 * Integrates IntegratedSocialFlow into key user journey points
 */

const fs = require('fs');
const path = require('path');

const integrations = [
  {
    file: 'src/pages/Index.tsx',
    insertAfter: 'const { streak, totalMinutes, history } = useSessionHistory();',
    code: `  const { isAuthenticated, currentAccount } = useLensIntegration();`,
    import: `import { IntegratedSocialFlow } from "@/components/social/IntegratedSocialFlow";\nimport { useLensIntegration } from "@/hooks/useLensIntegration";`
  },
  {
    file: 'src/pages/BreathingSession.tsx',
    insertAfter: 'const [cameraRequested, setCameraRequested] = useState(false);',
    code: `  const { isAuthenticated } = useLensIntegration();`,
    import: `import { useLensIntegration } from "@/hooks/useLensIntegration";`
  },
  {
    file: 'src/pages/Results.tsx',
    insertAfter: 'import { ShareToLensButton } from "@/components/social/ShareToLensButton";',
    code: '',
    import: `import { IntegratedSocialFlow } from "@/components/social/IntegratedSocialFlow";`
  }
];

function addImportToFile(filePath, importStatement) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if import already exists
  if (content.includes(importStatement.split('\n')[0])) {
    console.log(`✅ Import already exists in ${filePath}`);
    return true;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('from "react"')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ Added import to ${filePath}`);
    return true;
  }

  console.log(`❌ Could not find import location in ${filePath}`);
  return false;
}

function addCodeToFile(filePath, insertAfter, code) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if code already exists
  if (content.includes(code.trim())) {
    console.log(`✅ Code already exists in ${filePath}`);
    return true;
  }

  const insertIndex = content.indexOf(insertAfter);
  if (insertIndex !== -1) {
    const insertPosition = insertIndex + insertAfter.length;
    const newContent = content.slice(0, insertPosition) + '\n' + code + content.slice(insertPosition);
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Added code to ${filePath}`);
    return true;
  }

  console.log(`❌ Could not find insertion point in ${filePath}`);
  return false;
}

function main() {
  console.log('🌐 Integrating Social Flow into User Journey...\n');

  let successCount = 0;
  let totalOperations = 0;

  integrations.forEach(integration => {
    console.log(`📝 Processing ${integration.file}...`);
    
    // Add import
    if (integration.import) {
      totalOperations++;
      if (addImportToFile(integration.file, integration.import)) {
        successCount++;
      }
    }

    // Add code
    if (integration.code) {
      totalOperations++;
      if (addCodeToFile(integration.file, integration.insertAfter, integration.code)) {
        successCount++;
      }
    }

    console.log('');
  });

  console.log(`🎉 Integration complete: ${successCount}/${totalOperations} operations successful\n`);

  // Create integration checklist
  const checklist = `
# 🌐 Social Integration Checklist

## ✅ Automated Integrations
- [${integrations[0] ? 'x' : ' '}] Index page imports added
- [${integrations[1] ? 'x' : ' '}] BreathingSession imports added  
- [${integrations[2] ? 'x' : ' '}] Results page imports added

## 📋 Manual Integration Steps

### 1. Update Index Page (src/pages/Index.tsx)
Add to the main content area:
\`\`\`tsx
{/* Community Context */}
<div className="mb-6">
  <IntegratedSocialFlow 
    phase="discovery" 
    onSocialAction={(action, data) => console.log('Discovery:', action, data)}
  />
</div>
\`\`\`

### 2. Update BreathingSession Page (src/pages/BreathingSession.tsx)
Add to SessionInProgress component:
\`\`\`tsx
{/* Social Context During Session */}
{state.isRunning && (
  <div className="absolute top-4 left-4 z-20">
    <IntegratedSocialFlow 
      phase="session" 
      onSocialAction={(action, data) => console.log('Session:', action, data)}
    />
  </div>
)}
\`\`\`

### 3. Update SessionCompleteModal (src/components/unified/SessionCompleteModal.tsx)
Replace existing modal content with:
\`\`\`tsx
<IntegratedSocialFlow 
  phase="completion" 
  sessionData={{
    patternName: sessionData.patternName,
    duration: sessionData.duration,
    score: Math.max(0, 100 - sessionData.restlessnessScore),
    insights: [\`Completed \${sessionData.patternName} session\`]
  }}
  onSocialAction={handleSocialAction}
/>
\`\`\`

### 4. Update Results Page (src/pages/Results.tsx)
Add community tab:
\`\`\`tsx
<TabsContent value="community">
  <IntegratedSocialFlow 
    phase="community" 
    onSocialAction={(action, data) => console.log('Community:', action, data)}
  />
</TabsContent>
\`\`\`

## 🧪 Testing Steps
1. \`npm run dev\` - Start development server
2. \`npm run test:lens\` - Test Lens integration
3. Navigate through user journey:
   - Home → See trending patterns
   - Session → See live community indicator  
   - Complete → See immediate share options
   - Community → See full social feed

## 🚀 Deployment Ready
Once manual steps are complete, the social integration will be seamless throughout the user journey!
`;

  fs.writeFileSync('SOCIAL_INTEGRATION_CHECKLIST.md', checklist);
  console.log('📋 Created SOCIAL_INTEGRATION_CHECKLIST.md with next steps');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Complete manual integration steps in checklist');
  console.log('2. Test user journey: npm run dev');
  console.log('3. Test Lens integration: npm run test:lens');
  console.log('4. Deploy seamless social experience! 🚀');
}

main();