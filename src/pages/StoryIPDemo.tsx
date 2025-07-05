import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Copyright, Coins, Users, Award, Banknote, Share2, Scale } from 'lucide-react';
import { StoryIPHub } from '@/components/story/StoryIPHub';

const StoryIPDemo: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Story Protocol IP Management</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Register breathing patterns as intellectual property, create programmable licenses, 
          and build sustainable creator economies with Story Protocol's IP infrastructure.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle className="text-lg">IP Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Register breathing patterns as on-chain IP assets with verifiable ownership and provenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Award className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle className="text-lg">Programmable Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create flexible licensing terms with automated enforcement and revenue sharing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Coins className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle className="text-lg">Royalty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automated royalty payments to creators and derivative work attribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Users className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle className="text-lg">Creator Economy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Build sustainable revenue streams for wellness creators and instructors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* IP Management Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why IP Management for Breathing Patterns?</CardTitle>
          <CardDescription>
            Understanding the value of intellectual property protection in the wellness space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-red-500" />
                Traditional IP Challenges
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Expensive legal processes for IP protection</li>
                <li>• Difficult to prove ownership and originality</li>
                <li>• Complex licensing negotiations</li>
                <li>• Manual royalty collection and distribution</li>
                <li>• Limited global enforcement capabilities</li>
                <li>• High barriers for individual creators</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Story Protocol Solutions
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• On-chain IP registration with immutable proof</li>
                <li>• Automated licensing with programmable terms</li>
                <li>• Instant royalty distribution to creators</li>
                <li>• Global, permissionless IP protection</li>
                <li>• Low-cost registration for all creators</li>
                <li>• Composable IP for derivative works</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-semibold mb-2">Perfect for Wellness IP</h4>
            <p className="text-sm text-muted-foreground">
              Breathing patterns, meditation techniques, and wellness practices represent valuable 
              intellectual property that creators deserve to protect and monetize. Story Protocol 
              enables wellness instructors to register their techniques as IP, create flexible 
              licensing terms, and build sustainable revenue streams while allowing others to 
              legally build upon their work through derivative licensing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            How Story Protocol integrates with breathing pattern NFTs and multichain architecture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                IP Registration
              </h4>
              <p className="text-sm text-muted-foreground">
                Breathing patterns become IP Assets with metadata, ownership, and licensing terms
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" />
                License Management
              </h4>
              <p className="text-sm text-muted-foreground">
                Programmable licenses with commercial terms, revenue sharing, and derivative rights
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Revenue Distribution
              </h4>
              <p className="text-sm text-muted-foreground">
                Automated royalty payments to creators and parent IP holders
              </p>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`// Example: Register breathing pattern as IP
const patternData = {
  name: "4-7-8 Relaxation Technique",
  description: "A calming breathing pattern for stress relief",
  inhale: 4, hold: 7, exhale: 8, rest: 2,
  creator: userAddress
};

const ipResult = await storyClient.registerBreathingPatternIP(
  patternData,
  'commercialRemix',
  { revShare: 10, mintingFee: 0.01 }
);

// Pattern is now protected IP with licensing terms
console.log(\`IP registered: \${ipResult.ipId}\`);`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Main Demo Component */}
      <StoryIPHub />

      {/* Multichain Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Multichain Ecosystem</CardTitle>
          <CardDescription>
            How Story Protocol completes our three-chain architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <h4 className="font-semibold mb-2">Flow Blockchain</h4>
              <p className="text-sm text-muted-foreground mb-2">Transactional Layer</p>
              <ul className="text-xs space-y-1">
                <li>• NFT minting with batched transactions</li>
                <li>• Native VRF for pattern generation</li>
                <li>• Sponsored transactions for onboarding</li>
                <li>• USDC payments and marketplace</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <h4 className="font-semibold mb-2">Lens Protocol</h4>
              <p className="text-sm text-muted-foreground mb-2">Social Layer</p>
              <ul className="text-xs space-y-1">
                <li>• Decentralized social profiles</li>
                <li>• Share breathing sessions publicly</li>
                <li>• Community engagement and follows</li>
                <li>• Social proof for IP creators</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
              <h4 className="font-semibold mb-2">Story Protocol</h4>
              <p className="text-sm text-muted-foreground mb-2">IP Layer</p>
              <ul className="text-xs space-y-1">
                <li>• IP registration and protection</li>
                <li>• Programmable licensing terms</li>
                <li>• Automated royalty distribution</li>
                <li>• Derivative work management</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 dark:from-blue-950 dark:via-green-950 dark:to-purple-950 rounded-lg">
            <h4 className="font-semibold mb-2">🌟 Complete User Journey</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Create:</strong> Mint breathing pattern NFT on Flow with batched transactions → 
              <strong> Protect:</strong> Register as IP on Story with licensing terms → 
              <strong> Share:</strong> Post to Lens community for discovery → 
              <strong> Monetize:</strong> Earn royalties from licenses and derivatives → 
              <strong> Scale:</strong> Build sustainable creator economy across all three chains
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>
            Current implementation status of Story Protocol features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Implemented Features</h4>
              <ul className="text-sm space-y-1">
                <li>• Story Protocol client integration</li>
                <li>• IP Asset registration for breathing patterns</li>
                <li>• Programmable license creation (PIL)</li>
                <li>• Commercial and non-commercial terms</li>
                <li>• License token minting</li>
                <li>• Royalty payment system</li>
                <li>• Revenue claiming functionality</li>
                <li>• Derivative work registration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🚧 Advanced Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• IPFS metadata storage integration</li>
                <li>• Advanced royalty policy configurations</li>
                <li>• Dispute resolution mechanisms</li>
                <li>• Cross-chain IP synchronization</li>
                <li>• Bulk IP registration operations</li>
                <li>• IP marketplace integration</li>
                <li>• Analytics and reporting dashboard</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold mb-2">🎯 Hackathon Demo Ready</h4>
            <p className="text-sm text-muted-foreground">
              The Story Protocol integration is functional and ready for demonstration. 
              Users can register breathing patterns as IP assets, create licensing terms, 
              mint licenses, and manage royalties. This completes our multichain ecosystem 
              with Flow (transactions), Lens (social), and Story (IP) working together 
              to create a comprehensive decentralized wellness platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryIPDemo;
