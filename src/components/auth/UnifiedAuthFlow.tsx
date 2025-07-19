import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Mail,
  Wallet,
  Users,
  Coins,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedAuthFlowProps {
  onComplete?: () => void;
  requiredLevel?: 'email' | 'wallet' | 'full';
  className?: string;
}

interface AuthStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  blockchain?: 'flow' | 'lens' | 'story';
  utility: string;
}

const AUTH_STEPS: AuthStep[] = [
  {
    id: 'email',
    title: 'Create Account',
    description: 'Save your progress and access personalized features',
    icon: Mail,
    required: true,
    utility: 'Core identity and progress tracking',
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Enable blockchain features and true ownership',
    icon: Wallet,
    required: false,
    utility: 'Gateway to Web3 features',
  },
  {
    id: 'flow',
    title: 'Flow Blockchain',
    description: 'Mint and trade breathing pattern NFTs',
    icon: Coins,
    required: false,
    blockchain: 'flow',
    utility: 'NFT marketplace and digital ownership',
  },
  {
    id: 'lens',
    title: 'Lens Protocol',
    description: 'Join the decentralized wellness community',
    icon: Users,
    required: false,
    blockchain: 'lens',
    utility: 'Decentralized social features',
  },
  {
    id: 'story',
    title: 'Story Protocol',
    description: 'Protect your patterns and earn royalties',
    icon: Shield,
    required: false,
    blockchain: 'story',
    utility: 'IP rights and creator monetization',
  },
];

export const UnifiedAuthFlow: React.FC<UnifiedAuthFlowProps> = ({
  onComplete,
  requiredLevel = 'email',
  className,
}) => {
  const isMobile = useIsMobile();
  const {
    authLevel,
    isAuthenticated,
    walletConnected,
    flow,
    lens,
    story,
    authenticateWithEmail,
    connectWallet,
    connectFlow,
    connectLens,
    connectStory,
  } = useUnifiedAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress
  const completedSteps = AUTH_STEPS.filter(step => {
    switch (step.id) {
      case 'email': return isAuthenticated;
      case 'wallet': return walletConnected;
      case 'flow': return flow.connected;
      case 'lens': return lens.connected;
      case 'story': return story.connected;
      default: return false;
    }
  }).length;

  const progress = (completedSteps / AUTH_STEPS.length) * 100;

  // Check if required level is met
  const isRequiredLevelMet = () => {
    switch (requiredLevel) {
      case 'email': return authLevel !== 'none';
      case 'wallet': return authLevel === 'wallet' || authLevel === 'full';
      case 'full': return authLevel === 'full';
      default: return true;
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await authenticateWithEmail(email, password, isSignUp);
    
    if (result.success) {
      setCurrentStep(1); // Move to wallet connection
    } else {
      setError(result.error || "Authentication failed");
    }
    
    setIsLoading(false);
  };

  const handleWalletConnect = async () => {
    setIsLoading(true);
    setError(null);

    const result = await connectWallet();
    
    if (result.success) {
      setCurrentStep(2); // Move to blockchain connections
    } else {
      setError(result.error || "Wallet connection failed");
    }
    
    setIsLoading(false);
  };

  const handleBlockchainConnect = async (blockchain: 'flow' | 'lens' | 'story') => {
    setIsLoading(true);
    setError(null);

    let result;
    switch (blockchain) {
      case 'flow':
        result = await connectFlow();
        break;
      case 'lens':
        result = await connectLens();
        break;
      case 'story':
        result = await connectStory();
        break;
    }

    if (!result.success) {
      setError(result.error || `${blockchain} connection failed`);
    }
    
    setIsLoading(false);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const getCurrentStepComponent = () => {
    const step = AUTH_STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleEmailAuth(false)}
                disabled={isLoading}
                className="w-full touch-manipulation"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEmailAuth(true)}
                disabled={isLoading}
                className="w-full touch-manipulation"
              >
                Create Account
              </Button>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to enable blockchain features like NFT minting and trading.
            </p>
            <Button
              onClick={handleWalletConnect}
              disabled={isLoading}
              className="w-full touch-manipulation"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              Connect Wallet
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        );

      default:
        // Blockchain connection steps
        if (step.blockchain) {
          const isConnected = 
            (step.blockchain === 'flow' && flow.connected) ||
            (step.blockchain === 'lens' && lens.connected) ||
            (step.blockchain === 'story' && story.connected);

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {step.blockchain.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">{step.utility}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <Button
                  onClick={() => handleBlockchainConnect(step.blockchain!)}
                  disabled={isLoading || !walletConnected}
                  className="w-full touch-manipulation"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Connect {step.title}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          );
        }
        return null;
    }
  };

  // If required level is met, show completion
  if (isRequiredLevelMet()) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>You're all set!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your account is ready. You can now access all available features.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Authentication Level:</span>
              <Badge>{authLevel}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Available Features:</span>
              <span className="text-muted-foreground">{completedSteps}/{AUTH_STEPS.length}</span>
            </div>
          </div>
          <Button onClick={handleComplete} className="w-full">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Connect Your Account</CardTitle>
          <Badge variant="outline">{completedSteps}/{AUTH_STEPS.length}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Step */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {React.createElement(AUTH_STEPS[currentStep]?.icon, {
                className: "h-5 w-5 text-primary",
              })}
            </div>
            <div>
              <h3 className="font-semibold">{AUTH_STEPS[currentStep]?.title}</h3>
              <p className="text-sm text-muted-foreground">
                {AUTH_STEPS[currentStep]?.description}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {getCurrentStepComponent()}
        </div>

        {/* Step Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Progress Overview</h4>
          {AUTH_STEPS.map((step, index) => {
            const isCompleted = 
              (step.id === 'email' && isAuthenticated) ||
              (step.id === 'wallet' && walletConnected) ||
              (step.id === 'flow' && flow.connected) ||
              (step.id === 'lens' && lens.connected) ||
              (step.id === 'story' && story.connected);

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded text-sm",
                  index === currentStep && "bg-primary/5 border border-primary/20",
                  isCompleted && "text-green-600"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  isCompleted ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
                </div>
                <span className="flex-1">{step.title}</span>
                {step.blockchain && (
                  <Badge variant="outline" className="text-xs">
                    {step.blockchain.toUpperCase()}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedAuthFlow;