import * as StorySDK from '@story-protocol/core-sdk';

// Log all available exports from the SDK
console.log('SDK exports:', Object.keys(StorySDK));

// If there's a named export called StoryClient, log its type
if (StorySDK.StoryClient) {
  console.log('StoryClient type:', typeof StorySDK.StoryClient);
}

// If there are any factory methods, log them
const factoryMethods = Object.keys(StorySDK).filter(key => 
  typeof (StorySDK as any)[key] === 'function' && 
  key.toLowerCase().includes('client')
);
console.log('Potential factory methods:', factoryMethods);

export default function getSDKInfo() {
  return {
    exports: Object.keys(StorySDK),
    methods: Object.keys(StorySDK).map(key => ({
      name: key,
      type: typeof (StorySDK as any)[key]
    }))
  };
}