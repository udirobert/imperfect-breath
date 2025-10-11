/**
 * Lens Authentication Component
 * ENHANCEMENT FIRST: Leverages existing useLensAuth hook and UI patterns
 * CLEAN: Focused component for Lens-specific authentication flow
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Wallet, ExternalLink, CheckCircle, User, Plus } from "lucide-react";
import { useLensAuth } from "../composables/useLensAuth";
import { useAccount } from "wagmi";

interface LensAuthProps {
  onSuccess?: (profile: unknown) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function LensAuth({ onSuccess, onError, className }: LensAuthProps) {
  const { address, isConnected } = useAccount();
  const {
    profile,
    isLoading,
    error,
    isAuthenticated,
    authenticate,
    refreshProfile,
    lensProfile,
    hasLensProfile,
    lensHandle,
  } = useLensAuth();

  const [walletAddress, setWalletAddress] = useState(address || "");
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    name: "",
    bio: "",
  });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Handle authentication
  const handleAuthenticate = useCallback(async () => {
    const addressToUse = isConnected ? address : walletAddress.trim();
    
    if (!addressToUse) {
      onError?.("Please connect your wallet or enter a wallet address");
      return;
    }

    try {
      await authenticate(addressToUse);
      if (lensProfile) {
        onSuccess?.(lensProfile);
      } else {
        // No profile found, show creation flow
        setShowProfileCreation(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      onError?.(errorMessage);
    }
  }, [address, isConnected, walletAddress, authenticate, lensProfile, onSuccess, onError]);

  // Handle profile creation
  const handleCreateProfile = useCallback(async () => {
    if (!profileData.username.trim()) {
      onError?.("Username is required");
      return;
    }

    setIsCreatingProfile(true);
    
    try {
      // Mock profile creation - in real implementation, this would call Lens API
      console.log("Creating Lens profile:", profileData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful profile creation
      const newProfile = {
        id: `${Date.now()}`,
        handle: `${profileData.username}.lens`,
        name: profileData.name || profileData.username,
        bio: profileData.bio,
        ownedBy: address || walletAddress,
      };
      
      onSuccess?.(newProfile);
      setShowProfileCreation(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Profile creation failed";
      onError?.(errorMessage);
    } finally {
      setIsCreatingProfile(false);
    }
  }, [profileData, address, walletAddress, onSuccess, onError]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refreshProfile();
      if (lensProfile) {
        onSuccess?.(lensProfile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Refresh failed";
      onError?.(errorMessage);
    }
  }, [refreshProfile, lensProfile, onSuccess, onError]);

  // Profile creation form
  if (showProfileCreation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Your Lens Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username *</label>
            <div className="relative">
              <Input
                placeholder="Enter username"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                disabled={isCreatingProfile}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                .lens
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your unique handle on Lens Protocol
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              placeholder="Your display name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isCreatingProfile}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Input
              placeholder="Tell us about yourself..."
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              disabled={isCreatingProfile}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProfileCreation(false)}
              disabled={isCreatingProfile}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={isCreatingProfile || !profileData.username.trim()}
              className="flex-1"
            >
              {isCreatingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Profile
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Your profile will be created on Lens Protocol</p>
            <p>• Username cannot be changed later</p>
            <p>• Profile creation may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If already authenticated, show profile
  if (isAuthenticated && hasLensProfile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Connected to Lens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={lensProfile?.picture} />
              <AvatarFallback>
                {lensProfile?.name?.charAt(0) || lensProfile?.handle?.charAt(0) || "L"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{lensProfile?.name || "Lens User"}</div>
              <div className="text-sm text-muted-foreground">{lensHandle}</div>
            </div>
            <Badge variant="secondary">Connected</Badge>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://lens.xyz/u/${lensHandle}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
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
          <Wallet className="h-5 w-5" />
          Connect to Lens Protocol
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <Input
              placeholder="Enter wallet address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        {isConnected && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        )}

        <Button
          onClick={handleAuthenticate}
          disabled={isLoading || (!isConnected && !walletAddress.trim())}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isConnected ? "Connect to Lens" : "Authenticate with Lens"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Decentralized social protocol</p>
          <p>• Own your content and connections</p>
          <p>• Gasless transactions on Lens Chain</p>
          <p>• Create profile if you don't have one</p>
        </div>
      </CardContent>
    </Card>
  );
}