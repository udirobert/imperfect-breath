import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Share, Heart, Zap, Globe } from 'lucide-react';
import { LensSocialHub } from '@/components/lens/LensSocialHub';
import { LensProvider } from '@/providers/LensProvider';

const LensSocialDemo: React.FC = () => {
  return (
    <LensProvider>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Lens Protocol Social Features</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Share your breathing journey, connect with the wellness community, and build your 
            decentralized social presence with Lens Protocol integration.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Decentralized Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Own your social identity and data with Lens Protocol's decentralized accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <MessageCircle className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Social Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share breathing sessions, insights, and progress with the wellness community
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Share className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-lg">NFT Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share your breathing pattern NFTs and showcase your collection socially
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Globe className="h-8 w-8 text-orange-500 mb-2" />
              <CardTitle className="text-lg">Community Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Discover and engage with breathing content from the global wellness community
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Why Lens Protocol for Wellness?</CardTitle>
            <CardDescription>
              Understanding the benefits of decentralized social for breathing and wellness apps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Traditional Social Media
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Platform owns your data and connections</li>
                  <li>• Algorithm controls content visibility</li>
                  <li>• Risk of account suspension or deletion</li>
                  <li>• Limited monetization for creators</li>
                  <li>• No true ownership of content</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Lens Protocol Benefits
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• You own your social graph and data</li>
                  <li>• Transparent, user-controlled algorithms</li>
                  <li>• Censorship-resistant social presence</li>
                  <li>• Direct creator monetization</li>
                  <li>• Portable social identity across apps</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold mb-2">Perfect for Wellness Communities</h4>
              <p className="text-sm text-muted-foreground">
                Wellness and mindfulness communities benefit greatly from decentralized social features. 
                Users can build authentic connections, share progress without platform interference, 
                and maintain ownership of their wellness journey data. Lens Protocol enables 
                sustainable creator economies where wellness instructors and content creators 
                can be directly supported by their community.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              How Lens Protocol integrates with breathing pattern NFTs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Sign-in with Ethereum (SIWE) for secure, wallet-based authentication
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Content Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Breathing sessions and NFTs become social posts with rich metadata
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Social Graph</h4>
                <p className="text-sm text-muted-foreground">
                  Follow wellness creators and build communities around breathing practices
                </p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`// Example: Sharing a breathing session on Lens
const sessionData = {
  patternName: "4-7-8 Relaxation",
  duration: 300, // 5 minutes
  score: 85,
  insights: [
    "Improved focus during the session",
    "Felt more relaxed afterwards"
  ]
};

const postHash = await lensClient.createBreathingSessionPost(sessionData);
// Post appears on user's Lens profile and in followers' timelines`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Main Demo Component */}
        <LensSocialHub />

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>
              Current implementation status of Lens Protocol features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Implemented Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• Lens Protocol client integration</li>
                  <li>• SIWE authentication flow</li>
                  <li>• Account discovery and selection</li>
                  <li>• Post creation for breathing sessions</li>
                  <li>• NFT sharing capabilities</li>
                  <li>• Comment and quote functionality</li>
                  <li>• Timeline and highlights fetching</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🚧 In Development</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Metadata storage integration (IPFS)</li>
                  <li>• Rich media post support</li>
                  <li>• Advanced feed filtering</li>
                  <li>• Push notifications</li>
                  <li>• Creator monetization features</li>
                  <li>• Community group management</li>
                  <li>• Cross-app social portability</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 Hackathon Demo Ready</h4>
              <p className="text-sm text-muted-foreground">
                The core Lens Protocol integration is functional and ready for demonstration. 
                Users can authenticate with their Lens accounts, share breathing sessions, 
                and interact with the decentralized social features. This showcases the 
                potential for building wellness communities on decentralized social infrastructure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LensProvider>
  );
};

export default LensSocialDemo;
