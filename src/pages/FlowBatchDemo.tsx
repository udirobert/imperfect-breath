import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Layers, Shield, Coins } from "lucide-react";
import { BatchedPatternMinter } from "@/components/flow/BatchedPatternMinter";
import { useFlow } from "@/hooks/useFlow";
import { useToast } from "@/hooks/use-toast";

const FlowBatchDemo: React.FC = () => {
  const { toast } = useToast();
  const { state, user, coaInfo, isLoading, isConnecting, connect, disconnect } =
    useFlow();

  // Derived values for easier access
  const isConnected = state.isConnected;
  const flowAddress = user?.addr;
  const coaAddress = coaInfo?.address;

  useEffect(() => {
    // Initialize Flow connection on component mount
    connect();
  }, [connect]);

  const handleConnect = async () => {
    try {
      const fcl = await import("@onflow/fcl");
      await fcl.authenticate();
      toast({
        title: "Connected to Flow!",
        description:
          "You can now use batched transactions and other Flow features.",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Flow wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Flow wallet.",
      });
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Flow Supercharged Breathing Patterns
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the power of Flow's cross-VM capabilities with batched
          transactions, native randomness, and sponsored onboarding for
          breathing pattern NFTs.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle className="text-lg">Batched Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mint multiple NFTs with a single signature using Flow's cross-VM
              functionality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Layers className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle className="text-lg">Native VRF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate truly random breathing pattern variations using Flow's
              built-in randomness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle className="text-lg">Sponsored Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Walletless onboarding with sponsored breathing sessions for new
              users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Coins className="h-8 w-8 text-yellow-500 mb-2" />
            <CardTitle className="text-lg">Low Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inexpensive gas fees without compromising security or
              decentralization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Wallet Connection</CardTitle>
          <CardDescription>
            Connect your Flow wallet to access advanced features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Connected</Badge>
                    <span className="text-sm">Flow Address: {flowAddress}</span>
                  </div>
                  {coaAddress && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">COA Available</Badge>
                      <span className="text-sm">EVM Address: {coaAddress}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Not Connected</Badge>
                  <span className="text-sm">
                    Connect to access batched transactions
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={isLoading}
              variant={isConnected ? "outline" : "default"}
            >
              {isLoading
                ? "Connecting..."
                : isConnected
                ? "Disconnect"
                : "Connect Flow Wallet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding Flow's cross-VM capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Traditional EVM Approach</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Each NFT mint = separate transaction</li>
                <li>• Multiple wallet signatures required</li>
                <li>• Higher gas costs for multiple operations</li>
                <li>• No native randomness (requires oracles)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Flow Enhanced Approach</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Batch multiple operations in single Cadence transaction
                </li>
                <li>• One signature for multiple EVM calls</li>
                <li>• Lower overall transaction costs</li>
                <li>• Native VRF for true randomness</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold mb-2">FLIP 316 Implementation</h4>
            <p className="text-sm text-muted-foreground">
              This demo uses Flow's FLIP 316 improvements to FCL, enabling
              seamless integration between Flow Cadence and Flow EVM. The
              batched transactions are executed through a Cadence transaction
              that manages multiple EVM calls via your Cadence Owned Account
              (COA).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Demo Component */}
      <BatchedPatternMinter />

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Example</CardTitle>
          <CardDescription>
            How batched transactions work under the hood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              {`// Cadence transaction for batched EVM calls
transaction(calls: [{String: AnyStruct}], mustPass: Bool) {
  let coa: auth(EVM.Call) &EVM.CadenceOwnedAccount

  prepare(signer: auth(BorrowValue) & Account) {
    self.coa = signer.storage.borrow<auth(EVM.Call) &EVM.CadenceOwnedAccount>(
      from: /storage/evm
    ) ?? panic("No COA found")
  }

  execute {
    for i, call in calls {
      let result = self.coa.call(
        to: EVM.addressFromString(call["to"] as! String),
        data: (call["data"] as! String).decodeHex(),
        gasLimit: call["gasLimit"] as! UInt64,
        value: EVM.Balance(attoflow: call["value"] as! UInt)
      )
      
      if mustPass {
        assert(result.status == EVM.Status.successful)
      }
    }
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowBatchDemo;
