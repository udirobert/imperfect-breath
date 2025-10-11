/**
 * Flow Authentication Component
 * ENHANCEMENT FIRST: Leverages existing useFlowAuth hook and UI patterns
 * CLEAN: Focused component for Flow-specific authentication flow
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Coins, ExternalLink, CheckCircle, Zap, Mail, Wallet, Sparkles } from "lucide-react";
import { useFlowAuth } from "../composables/useFlowAuth";
import EnhancedFlowClient from "../../lib/flow/enhanced-flow-client";

interface FlowAuthProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FlowAuth({ onSuccess, onError, className }: FlowAuthProps) {
  const {
    user,
    isLoading,
    isLoggedIn,
    address,
    flowUser,
    login,
    logout,
    hasFlowAccount,
    flowAddress,
  } = useFlowAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [walletlessEmail, setWalletlessEmail] = useState("");
  const [walletlessName, setWalletlessName] = useState("");
  const [authMethod, setAuthMethod] = useState<"wallet" | "walletless">("wallet");

  // Handle wallet authentication
  const handleWalletAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    
    try {
      await login();
      if (flowUser) {
        onSuccess?.(flowUser);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Flow authentication failed";
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  }, [login, flowUser, onSuccess, onError]);

  // Handle walletless account creation
  const handleWalletlessSignup = useCallback(async () => {
    if (!walletlessEmail || !walletlessName) {
      onError?.("Please fill in all fields");
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      // Simulate custodial account creation
      // In a real implementation, this would:
      // 1. Create a custodial Flow account on the backend
      // 2. Store the account keys securely
      // 3. Return account info to the frontend
      
      const mockCustodialAccount = {
        address: `0x${Math.random().toString(16).substr(2, 16)}`,
        email: walletlessEmail,
        name: walletlessName,
        isCustodial: true,
        loggedIn: true,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess?.(mockCustodialAccount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Account creation failed";
      onError?.(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  }, [walletlessEmail, walletlessName, onSuccess, onError]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      onError?.(errorMessage);
    }
  }, [logout, onError]);

  // If already authenticated, show profile
  if (isLoggedIn && hasFlowAccount) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Connected to Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <Coins className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">Flow Account</div>
              <div className="text-sm text-muted-foreground">
                {flowAddress?.slice(0, 8)}...{flowAddress?.slice(-4)}
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Connected
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>NFT Ready</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Coins className="h-4 w-4 text-blue-500" />
              <span>Flow Chain</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disconnect
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://flowscan.org/account/${flowAddress}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Authentication form
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Connect to Flow Blockchain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as "wallet" | "walletless")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="walletless" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Walletless
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your existing Flow wallet for full blockchain access
              </p>
            </div>

            <Button
              onClick={handleWalletAuthenticate}
              disabled={isAuthenticating || isLoading}
              className="w-full"
            >
              {(isAuthenticating || isLoading) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Connect Wallet
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Full control of your assets</p>
              <p>• Direct blockchain interaction</p>
              <p>• Compatible with Flow wallets</p>
            </div>
          </TabsContent>

          <TabsContent value="walletless" className="space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Get started instantly without a wallet - we'll create a secure account for you
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="walletless-email">Email Address</Label>
                <Input
                  id="walletless-email"
                  type="email"
                  placeholder="your@email.com"
                  value={walletlessEmail}
                  onChange={(e) => setWalletlessEmail(e.target.value)}
                  disabled={isCreatingAccount}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="walletless-name">Display Name</Label>
                <Input
                  id="walletless-name"
                  type="text"
                  placeholder="Your Name"
                  value={walletlessName}
                  onChange={(e) => setWalletlessName(e.target.value)}
                  disabled={isCreatingAccount}
                />
              </div>
            </div>

            <Button
              onClick={handleWalletlessSignup}
              disabled={isCreatingAccount || !walletlessEmail || !walletlessName}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isCreatingAccount && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Flow Account
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Instant account creation</p>
              <p>• No wallet setup required</p>
              <p>• Secure custodial management</p>
              <p>• Upgrade to self-custody later</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}