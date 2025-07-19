import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { UnifiedAuthFlow } from "./UnifiedAuthFlow";
import {
  Lock,
  Mail,
  Wallet,
  Users,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLevelGateProps {
  requiredLevel: 'email' | 'wallet' | 'full';
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const FEATURE_DESCRIPTIONS = {
  'breathing-sessions': 'Practice breathing patterns',
  'progress-tracking': 'Save and track your progress',
  'pattern-favorites': 'Save favorite patterns',
  'nft-minting': 'Mint breathing patterns as NFTs',
  'nft-purchasing': 'Purchase premium patterns',
  'marketplace-selling': 'Sell your patterns',
  'social-posting': 'Share your breathing journey',
  'social-following': 'Follow other practitioners',
  'community-features': 'Join the wellness community',
  'ip-registration': 'Protect your pattern IP',
  'royalty-earning': 'Earn from pattern usage',
  'licensing': 'License your patterns',
};

const BLOCKCHAIN_UTILITIES = {
  flow: {
    name: 'Flow Blockchain',
    icon: '🌊',
    purpose: 'NFT marketplace and digital ownership',
    features: ['Mint breathing pattern NFTs', 'Trade patterns', 'Collect rare patterns'],
  },
  lens: {
    name: 'Lens Protocol',
    icon: '👥',
    purpose: 'Decentralized social features',
    features: ['Share achievements', 'Follow practitioners', 'Community discussions'],
  },
  story: {
    name: 'Story Protocol',
    icon: '🛡️',
    purpose: 'IP rights and creator monetization',
    features: ['Protect pattern IP', 'Earn royalties', 'License patterns'],
  },
};

export const AuthLevelGate: React.FC<AuthLevelGateProps> = ({
  requiredLevel,
  feature,
  children,
  fallback,
  className,
}) => {
  const { authLevel, canAccessFeature, getRequiredAuthLevel } = useUnifiedAuth();
  const [showAuthFlow, setShowAuthFlow] = React.useState(false);

  // Check if user has required access
  const hasAccess = canAccessFeature(feature);
  const actualRequiredLevel = getRequiredAuthLevel(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show auth gate
  const getAuthLevelIcon = (level: string) => {
    switch (level) {
      case 'email': return Mail;
      case 'wallet': return Wallet;
      case 'full': return Shield;
      default: return Lock;
    }
  };

  const getAuthLevelColor = (level: string) => {
    switch (level) {
      case 'email': return 'text-blue-600 bg-blue-100';
      case 'wallet': return 'text-purple-600 bg-purple-100';
      case 'full': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBlockchainRequirements = () => {
    const requirements = [];
    
    if (['nft-minting', 'nft-purchasing', 'marketplace-selling'].includes(feature)) {
      requirements.push(BLOCKCHAIN_UTILITIES.flow);
    }
    
    if (['social-posting', 'social-following', 'community-features'].includes(feature)) {
      requirements.push(BLOCKCHAIN_UTILITIES.lens);
    }
    
    if (['ip-registration', 'royalty-earning', 'licensing'].includes(feature)) {
      requirements.push(BLOCKCHAIN_UTILITIES.story);
    }
    
    return requirements;
  };

  const blockchainRequirements = getBlockchainRequirements();
  const AuthLevelIcon = getAuthLevelIcon(actualRequiredLevel);

  if (showAuthFlow) {
    return (
      <div className={cn("space-y-4", className)}>
        <UnifiedAuthFlow
          requiredLevel={actualRequiredLevel as any}
          onComplete={() => setShowAuthFlow(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <div className={cn(
            "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
            getAuthLevelColor(actualRequiredLevel)
          )}>
            <AuthLevelIcon className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Authentication Required</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {FEATURE_DESCRIPTIONS[feature] || 'Access this feature'} requires{' '}
              <Badge className={getAuthLevelColor(actualRequiredLevel)}>
                {actualRequiredLevel} level
              </Badge>{' '}
              authentication.
            </p>
            
            <div className="text-sm text-muted-foreground">
              Current level: <Badge variant="outline">{authLevel}</Badge>
            </div>
          </div>

          {/* Blockchain Requirements */}
          {blockchainRequirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Required Blockchain Connections:</h4>
              {blockchainRequirements.map((blockchain) => (
                <div key={blockchain.name} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{blockchain.icon}</span>
                    <div>
                      <h5 className="font-medium text-sm">{blockchain.name}</h5>
                      <p className="text-xs text-muted-foreground">{blockchain.purpose}</p>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {blockchain.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Progressive Enhancement Notice */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Our platform uses progressive enhancement. Start with basic features and unlock 
              advanced capabilities as you connect more services.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowAuthFlow(true)}
              className="w-full"
            >
              Connect Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLevelGate;