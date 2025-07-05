/**
 * Story Protocol Helper Functions
 * Simplified interfaces for breathing pattern IP registration
 */

import { StoryBreathingClient, type BreathingPatternIP } from './story-client';
import { config } from '@/config/environment';

/**
 * Create commercial remix license terms for breathing patterns
 */
export function createCommercialRemixTerms(options: {
  defaultMintingFee: number; // in ETH
  commercialRevShare: number; // percentage (0-100)
}) {
  return {
    transferable: true,
    royaltyPolicy: '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E' as const,
    defaultMintingFee: BigInt(Math.floor(options.defaultMintingFee * 1e18)), // Convert to wei
    expiration: 0n,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: '0x0000000000000000000000000000000000000000' as const,
    commercializerCheckerData: '0x',
    commercialRevShare: options.commercialRevShare,
    commercialRevCeiling: 0n,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: '0x1514000000000000000000000000000000000000' as const, // $WIP token
    uri: 'https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialRemix.json'
  };
}

/**
 * Quick breathing pattern registration with sensible defaults
 */
export async function registerBreathingPattern(
  patternData: {
    name: string;
    description: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
    creator: string;
    tags?: string[];
    imageUri?: string;
  },
  options: {
    isTestnet?: boolean;
    privateKey?: string;
    licenseType?: 'nonCommercial' | 'commercialRemix';
    commercialTerms?: { revShare: number; mintingFee: number };
  } = {}
) {
  const {
    isTestnet = true,
    privateKey = config.story.privateKey,
    licenseType = 'nonCommercial',
    commercialTerms = { revShare: 10, mintingFee: 0.01 }
  } = options;

  // Initialize Story client
  const storyClient = new StoryBreathingClient(isTestnet, privateKey);

  // Convert to full BreathingPatternIP format
  const breathingPatternIP: BreathingPatternIP = {
    ...patternData,
    tags: patternData.tags || ['breathing', 'wellness', 'meditation'],
    imageUri: patternData.imageUri || generateDefaultPatternImage(patternData)
  };

  // Register the IP
  const result = await storyClient.registerBreathingPatternIP(
    breathingPatternIP,
    licenseType,
    commercialTerms
  );

  return {
    ...result,
    explorerUrl: `${storyClient.networkConfig.explorer}/ipa/${result.ipId}`,
    patternData: breathingPatternIP
  };
}

/**
 * Generate a default image URI for breathing patterns
 */
function generateDefaultPatternImage(pattern: {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
}): string {
  // Create a simple SVG visualization of the breathing pattern
  const totalTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;
  const inhalePercent = (pattern.inhale / totalTime) * 100;
  const holdPercent = (pattern.hold / totalTime) * 100;
  const exhalePercent = (pattern.exhale / totalTime) * 100;
  const restPercent = (pattern.rest / totalTime) * 100;

  const svg = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="${inhalePercent}%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="${inhalePercent + holdPercent}%" style="stop-color:#f59e0b;stop-opacity:1" />
          <stop offset="${inhalePercent + holdPercent + exhalePercent}%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="400" height="200" fill="url(#breathGradient)" rx="10"/>
      
      <text x="200" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">
        ${pattern.name}
      </text>
      
      <text x="200" y="80" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
        ${pattern.inhale}s Inhale • ${pattern.hold}s Hold • ${pattern.exhale}s Exhale • ${pattern.rest}s Rest
      </text>
      
      <text x="200" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
        Total Cycle: ${totalTime}s
      </text>
      
      <circle cx="200" cy="160" r="20" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="2"/>
      <text x="200" y="166" text-anchor="middle" fill="white" font-family="Arial" font-size="12">🌬️</text>
    </svg>
  `;

  // Convert SVG to data URI
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Quick derivative pattern registration
 */
export async function registerDerivativeBreathingPattern(
  originalIpId: string,
  licenseTermsId: string,
  derivativeData: {
    name: string;
    description: string;
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
    creator: string;
    tags?: string[];
    imageUri?: string;
  },
  options: {
    isTestnet?: boolean;
    privateKey?: string;
  } = {}
) {
  const { isTestnet = true, privateKey = config.story.privateKey } = options;

  const storyClient = new StoryBreathingClient(isTestnet, privateKey);

  const breathingPatternIP: BreathingPatternIP = {
    ...derivativeData,
    tags: derivativeData.tags || ['breathing', 'wellness', 'remix', 'derivative'],
    imageUri: derivativeData.imageUri || generateDefaultPatternImage(derivativeData)
  };

  const result = await storyClient.registerDerivativePattern(
    originalIpId,
    licenseTermsId,
    breathingPatternIP
  );

  return {
    ...result,
    explorerUrl: `${storyClient.networkConfig.explorer}/ipa/${result.ipId}`,
    patternData: breathingPatternIP
  };
}

/**
 * Utility to check if Story Protocol is properly configured
 */
export function isStoryConfigured(): boolean {
  return !!(config.story?.privateKey && config.story?.rpcUrl);
}

/**
 * Get Story Protocol network info
 */
export function getStoryNetworkInfo(isTestnet: boolean = true) {
  return {
    chainId: isTestnet ? 'aeneid' : 'mainnet',
    rpcUrl: isTestnet ? 'https://aeneid.storyrpc.io' : 'https://mainnet.storyrpc.io',
    explorer: isTestnet ? 'https://aeneid.explorer.story.foundation' : 'https://explorer.story.foundation',
    spgNftContract: isTestnet ? '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' : '0x98971c660ac20880b60F86Cc3113eBd979eb3aAE'
  };
}