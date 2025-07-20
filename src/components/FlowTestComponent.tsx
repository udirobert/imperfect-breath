import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useFlow } from "../hooks/useFlow";
import { toast } from "sonner";
import {
  Wallet,
  Plus,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Coins,
  Package,
} from "lucide-react";
import type {
  BreathingPatternAttributes,
  NFTMetadata,
} from "../lib/flow/types";

export const FlowTestComponent: React.FC = () => {
  const {
    state,
    user,
    isLoading,
    isConnecting,
    isMinting,
    error,
    connect,
    disconnect,
    mintBreathingPattern,
    getNFTs,
    setupAccount,
    clearError,
  } = useFlow({
    network: "testnet",
    autoConnect: false,
  });

  const [nfts, setNfts] = useState<
    Array<{ id: string; name?: string; description?: string }>
  >([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [patternForm, setPatternForm] = useState({
    name: "Test Breathing Pattern",
    description: "A test pattern created from Flow integration",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
  });

  const loadUserNFTs = useCallback(async () => {
    if (!user?.addr) return;

    setIsLoadingNFTs(true);
    try {
      const userNFTs = await getNFTs(user.addr);
      setNfts(
        userNFTs as Array<{ id: string; name?: string; description?: string }>,
      );
      console.log("Loaded NFTs:", userNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      toast.error("Failed to load NFTs");
    } finally {
      setIsLoadingNFTs(false);
    }
  }, [user?.addr, getNFTs]);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success("Connected to Flow wallet!");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  // Load NFTs when user connects
  useEffect(() => {
    if (state.isConnected && user?.addr) {
      loadUserNFTs();
    }
  }, [state.isConnected, user?.addr, loadUserNFTs]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setNfts([]);
      toast.success("Disconnected from Flow wallet");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect");
    }
  };

  const handleSetupAccount = async () => {
    try {
      const txId = await setupAccount();
      toast.success(`Account setup initiated! TX: ${txId.slice(0, 8)}...`);
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Failed to setup account");
    }
  };

  const handleMintPattern = async () => {
    if (!user?.addr) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const attributes: BreathingPatternAttributes = {
        inhale: patternForm.inhale,
        hold: patternForm.hold,
        exhale: patternForm.exhale,
        rest: patternForm.rest,
        difficulty: "beginner",
        category: "relaxation",
        tags: ["test", "breathing", "pattern"],
        totalCycles: 10,
        estimatedDuration:
          (patternForm.inhale +
            patternForm.hold +
            patternForm.exhale +
            patternForm.rest) *
          10,
      };

      const metadata: NFTMetadata = {
        name: patternForm.name,
        description: patternForm.description,
        image: "https://via.placeholder.com/300x300?text=Breathing+Pattern",
        attributes: [
          {
            trait_type: "Inhale Duration",
            value: patternForm.inhale.toString(),
          },
          { trait_type: "Hold Duration", value: patternForm.hold.toString() },
          {
            trait_type: "Exhale Duration",
            value: patternForm.exhale.toString(),
          },
          { trait_type: "Rest Duration", value: patternForm.rest.toString() },
          { trait_type: "Difficulty", value: "Beginner" },
          { trait_type: "Category", value: "Relaxation" },
        ],
      };

      const txId = await mintBreathingPattern(attributes, metadata, user.addr);
      toast.success(`Pattern minted! TX: ${txId.slice(0, 8)}...`);

      // Refresh NFTs after successful mint
      setTimeout(() => {
        loadUserNFTs();
      }, 3000); // Wait a bit for the transaction to be processed
    } catch (error) {
      console.error("Mint error:", error);
      toast.error("Failed to mint pattern");
    }
  };

  const renderConnectionStatus = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Flow Wallet Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                state.isConnected ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm">
              {state.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <Badge variant={state.isConnected ? "default" : "secondary"}>
            Flow Testnet
          </Badge>
        </div>

        {user?.addr && (
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground">
              Wallet Address
            </Label>
            <p className="text-sm font-mono break-all">{user.addr}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              onClick={clearError}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Clear Error
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {state.isConnected ? (
            <>
              <Button onClick={handleDisconnect} variant="outline">
                Disconnect
              </Button>
              <Button onClick={handleSetupAccount} variant="outline">
                Setup Account
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isLoading}
              className="w-full"
            >
              {isConnecting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Connect Wallet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderMintingForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Mint Breathing Pattern NFT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Pattern Name</Label>
            <Input
              id="name"
              value={patternForm.name}
              onChange={(e) =>
                setPatternForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter pattern name"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={patternForm.description}
              onChange={(e) =>
                setPatternForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your breathing pattern"
              rows={2}
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium">
            Breathing Phases (seconds)
          </Label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            <div>
              <Label htmlFor="inhale" className="text-xs">
                Inhale
              </Label>
              <Input
                id="inhale"
                type="number"
                min="1"
                max="20"
                value={patternForm.inhale}
                onChange={(e) =>
                  setPatternForm((prev) => ({
                    ...prev,
                    inhale: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="hold" className="text-xs">
                Hold
              </Label>
              <Input
                id="hold"
                type="number"
                min="0"
                max="20"
                value={patternForm.hold}
                onChange={(e) =>
                  setPatternForm((prev) => ({
                    ...prev,
                    hold: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="exhale" className="text-xs">
                Exhale
              </Label>
              <Input
                id="exhale"
                type="number"
                min="1"
                max="20"
                value={patternForm.exhale}
                onChange={(e) =>
                  setPatternForm((prev) => ({
                    ...prev,
                    exhale: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="rest" className="text-xs">
                Rest
              </Label>
              <Input
                id="rest"
                type="number"
                min="0"
                max="20"
                value={patternForm.rest}
                onChange={(e) =>
                  setPatternForm((prev) => ({
                    ...prev,
                    rest: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <strong>Pattern Preview:</strong> {patternForm.inhale}-
            {patternForm.hold}-{patternForm.exhale}-{patternForm.rest}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total cycle duration:{" "}
            {patternForm.inhale +
              patternForm.hold +
              patternForm.exhale +
              patternForm.rest}{" "}
            seconds
          </div>
        </div>

        <Button
          onClick={handleMintPattern}
          disabled={!state.isConnected || isMinting || !patternForm.name.trim()}
          className="w-full"
        >
          {isMinting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Send className="h-4 w-4 mr-2" />
          Mint Pattern NFT
        </Button>
      </CardContent>
    </Card>
  );

  const renderNFTCollection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your NFT Collection
          </div>
          <Button
            onClick={loadUserNFTs}
            disabled={isLoadingNFTs || !state.isConnected}
            variant="outline"
            size="sm"
          >
            {isLoadingNFTs ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!state.isConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Connect your wallet to view your NFT collection</p>
          </div>
        ) : isLoadingNFTs ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading your NFTs...</p>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No breathing pattern NFTs found</p>
            <p className="text-sm">Mint your first pattern above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nfts.map((nft, index) => (
              <div key={nft.id || index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">
                    {nft.name || `Pattern #${nft.id}`}
                  </h3>
                  <Badge variant="outline">{nft.id}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {nft.description || "Breathing pattern NFT"}
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Owned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Flow Blockchain Integration</h1>
        <p className="text-muted-foreground">
          Test minting and managing breathing pattern NFTs on Flow testnet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderConnectionStatus()}
          {renderMintingForm()}
        </div>
        <div>{renderNFTCollection()}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className={`h-3 w-3 rounded-full mx-auto mb-1 ${
                  state.isInitialized ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div className="text-xs">Initialized</div>
            </div>
            <div className="text-center">
              <div
                className={`h-3 w-3 rounded-full mx-auto mb-1 ${
                  state.isConnected ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div className="text-xs">Connected</div>
            </div>
            <div className="text-center">
              <div
                className={`h-3 w-3 rounded-full mx-auto mb-1 ${
                  nfts.length > 0 ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div className="text-xs">NFTs Loaded</div>
            </div>
            <div className="text-center">
              <div
                className={`h-3 w-3 rounded-full mx-auto mb-1 ${
                  !error ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="text-xs">No Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
