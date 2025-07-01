import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, Plus, Eye, Activity } from "lucide-react";
import { flowConfig } from "@/lib/flow/config";
import {
  flowNFTClient,
  type PatternData,
  type NFTDetails,
} from "@/lib/flow/nft-client";

interface User {
  loggedIn: boolean;
  addr?: string;
}

export default function FlowIntegrationExample() {
  const [user, setUser] = useState<User>({ loggedIn: false });
  const [loading, setLoading] = useState(false);
  const [hasCollection, setHasCollection] = useState(false);
  const [userNFTs, setUserNFTs] = useState<string[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Form state for minting
  const [mintForm, setMintForm] = useState<PatternData>({
    name: "4-7-8 Relaxation",
    description: "A calming breathing pattern for stress relief",
    phases: {
      inhale: 4,
      hold: 7,
      exhale: 8,
    },
    audioUrl: "",
  });

  // Subscribe to authentication state
  useEffect(() => {
    const unsubscribe = flowConfig.subscribeToAuth(setUser);
    return () => unsubscribe();
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user.addr) return;

    try {
      setLoading(true);

      // Check if user has collection setup
      const hasSetup = await flowNFTClient.hasCollectionSetup(user.addr);
      setHasCollection(hasSetup);

      if (hasSetup) {
        // Load user NFTs
        const nftIds = await flowNFTClient.getUserCollection(user.addr);
        setUserNFTs(nftIds);
        setStatus(`Found ${nftIds.length} NFTs in your collection`);
      } else {
        setStatus(
          'Collection not setup. Click "Setup Account" to get started.',
        );
      }
    } catch (err) {
      setError(
        `Failed to load user data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }, [user.addr]);

  // Load user data when authenticated
  useEffect(() => {
    if (user.loggedIn && user.addr) {
      loadUserData();
    }
  }, [user.loggedIn, user.addr, loadUserData]);

  const handleAuthenticate = async () => {
    try {
      setLoading(true);
      setError("");
      await flowConfig.authenticate();
      setStatus("Successfully connected to wallet!");
    } catch (err) {
      setError(
        `Authentication failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await flowConfig.unauthenticate();
      setUserNFTs([]);
      setSelectedNFT(null);
      setHasCollection(false);
      setStatus("Signed out successfully");
    } catch (err) {
      setError(
        `Sign out failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSetupAccount = async () => {
    try {
      setLoading(true);
      setError("");

      const txId = await flowNFTClient.setupAccount();
      setStatus(`Account setup transaction submitted: ${txId}`);

      // Wait for transaction and reload
      await flowConfig.waitForTransaction(txId);
      setStatus("Account setup completed! You can now mint NFTs.");
      await loadUserData();
    } catch (err) {
      setError(
        `Setup failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async () => {
    try {
      setLoading(true);
      setError("");

      const txId = await flowNFTClient.mintBreathingPattern(mintForm);
      setStatus(`Minting transaction submitted: ${txId}`);

      // Wait for transaction and reload
      await flowConfig.waitForTransaction(txId);
      setStatus("NFT minted successfully!");
      await loadUserData();
    } catch (err) {
      setError(
        `Minting failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewNFT = async (nftId: string) => {
    if (!user.addr) return;

    try {
      setLoading(true);
      const nftDetails = await flowNFTClient.getNFTDetails(user.addr, nftId);
      setSelectedNFT(nftDetails);
      setStatus(`Loaded details for NFT #${nftId}`);
    } catch (err) {
      setError(
        `Failed to load NFT details: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogSession = async (nftId: string) => {
    if (!user.addr) return;

    try {
      setLoading(true);
      setError("");

      const sessionData = {
        patternId: nftId,
        duration: 300, // 5 minutes
        bpm: 72,
        consistencyScore: 85.5,
        breathHoldTime: 7.2,
        aiScore: 92.0,
      };

      const txId = await flowNFTClient.logSessionData(nftId, sessionData);
      setStatus(`Session logged: ${txId}`);

      await flowConfig.waitForTransaction(txId);
      setStatus("Session data logged successfully!");
    } catch (err) {
      setError(
        `Failed to log session: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const updateMintForm = (field: string, value: string) => {
    if (field.startsWith("phases.")) {
      const phaseKey = field.split(".")[1];
      setMintForm((prev) => ({
        ...prev,
        phases: {
          ...prev.phases,
          [phaseKey]: parseInt(value) || 0,
        },
      }));
    } else {
      setMintForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🌬️ Flow Integration Example</h1>
        <p className="text-muted-foreground">
          Interact with the deployed ImperfectBreath contract on Flow testnet
        </p>
        <Badge variant="outline" className="text-green-600 border-green-600">
          Contract: 0xb8404e09b36b6623
        </Badge>
      </div>

      {/* Status and Error Messages */}
      {status && (
        <Alert>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user.loggedIn ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Connect your Flow wallet to get started
              </p>
              <Button onClick={handleAuthenticate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-green-800">
                  ✅ Wallet Connected
                </p>
                <p className="text-sm text-green-600">Address: {user.addr}</p>
                <p className="text-sm text-green-600">
                  Collection Setup: {hasCollection ? "✅ Ready" : "❌ Required"}
                </p>
              </div>
              <div className="flex gap-2">
                {!hasCollection && (
                  <Button onClick={handleSetupAccount} disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Setup Account
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mint NFT */}
      {user.loggedIn && hasCollection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Mint Breathing Pattern NFT
            </CardTitle>
            <CardDescription>
              Create a new breathing pattern as an NFT on the Flow blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pattern Name</Label>
                <Input
                  id="name"
                  value={mintForm.name}
                  onChange={(e) => updateMintForm("name", e.target.value)}
                  placeholder="e.g., 4-7-8 Breathing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audioUrl">Audio URL (optional)</Label>
                <Input
                  id="audioUrl"
                  value={mintForm.audioUrl}
                  onChange={(e) => updateMintForm("audioUrl", e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={mintForm.description}
                onChange={(e) => updateMintForm("description", e.target.value)}
                placeholder="Describe your breathing pattern..."
              />
            </div>

            <div className="space-y-2">
              <Label>Breathing Phases (seconds)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Inhale</Label>
                  <Input
                    type="number"
                    value={mintForm.phases.inhale}
                    onChange={(e) =>
                      updateMintForm("phases.inhale", e.target.value)
                    }
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Hold</Label>
                  <Input
                    type="number"
                    value={mintForm.phases.hold}
                    onChange={(e) =>
                      updateMintForm("phases.hold", e.target.value)
                    }
                    min="0"
                    max="30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Exhale</Label>
                  <Input
                    type="number"
                    value={mintForm.phases.exhale}
                    onChange={(e) =>
                      updateMintForm("phases.exhale", e.target.value)
                    }
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleMintNFT}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mint NFT
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User NFTs */}
      {user.loggedIn && hasCollection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your NFT Collection
            </CardTitle>
            <CardDescription>
              Breathing pattern NFTs you own ({userNFTs.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userNFTs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No NFTs found. Mint your first breathing pattern above!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nftId) => (
                  <Card key={nftId} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="text-center">
                        <Badge variant="secondary">NFT #{nftId}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewNFT(nftId)}
                          disabled={loading}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLogSession(nftId)}
                          disabled={loading}
                        >
                          <Activity className="mr-1 h-3 w-3" />
                          Log Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NFT Details */}
      {selectedNFT && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              NFT Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">ID</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedNFT.id}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Creator</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedNFT.creator}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-lg font-semibold">{selectedNFT.name}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                {selectedNFT.description}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Breathing Phases</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {Object.entries(selectedNFT.phases).map(([phase, duration]) => (
                  <div
                    key={phase}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="text-sm font-medium capitalize">{phase}</p>
                    <p className="text-lg font-bold text-blue-600">
                      {duration}s
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Audio URL</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedNFT.audioUrl || "Not provided"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Session History</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedNFT.sessionHistoryCount} sessions recorded
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedNFT(null)}
              className="w-full"
            >
              Close Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-blue-800">
              🌐 Connected to Flow Testnet
            </p>
            <p className="text-xs text-blue-600">
              Contract: {flowConfig.getConfig().contractAddress}
            </p>
            <div className="flex justify-center gap-4 text-xs text-blue-600">
              <a
                href={flowConfig.getAccountUrl(
                  flowConfig.getConfig().contractAddress,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View Contract Explorer
              </a>
              <span>•</span>
              <a
                href="https://developers.flow.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Flow Documentation
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
