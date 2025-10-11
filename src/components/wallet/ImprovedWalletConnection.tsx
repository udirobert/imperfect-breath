/**
 * Improved Wallet Connection Component
 * 
 * CLEAN: Better visual hierarchy and spacing
 * UX: Improved network switching and error handling
 * RESPONSIVE: Mobile-optimized layout
 * PERFORMANT: Efficient state management
 */

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Zap,
  Shield,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { lensTestnet } from '@/lib/wagmi/chains';
import { cn } from '@/lib/utils';

interface NetworkInfo {
  id: number;
  name: string;
  shortName: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
}

const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  [lensTestnet.id]: {
    id: lensTestnet.id,
    name: 'Lens Testnet',
    shortName: 'Lens',
    color: 'bg-green-500',
    icon: <Users className="h-4 w-4" />,
    features: ['Social Features', 'Lens Protocol', 'Community']
  },
  1: {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    color: 'bg-blue-500',
    icon: <Shield className="h-4 w-4" />,
    features: ['DeFi', 'NFTs', 'Main Network']
  },
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'Polygon',
    color: 'bg-purple-500',
    icon: <Zap className="h-4 w-4" />,
    features: ['Fast Transactions', 'Low Fees', 'Scaling']
  }
};

export const ImprovedWalletConnection: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);

  const currentNetwork = chain ? SUPPORTED_NETWORKS[chain.id] : null;
  const isOnSupportedNetwork = currentNetwork !== undefined;
  const isOnLensTestnet = chain?.id === lensTestnet.id;

  const handleConnect = (connector: any) => {
    connect({ connector });
    setIsDialogOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected successfully');
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        toast.success('Address copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };

  const handleNetworkSwitch = async (networkId: number) => {
    try {
      await switchChain({ chainId: networkId });
      toast.success(`Switched to ${SUPPORTED_NETWORKS[networkId].name}`);
      setIsNetworkDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      toast.error(`Failed to switch to ${SUPPORTED_NETWORKS[networkId].name}`);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const openExplorer = () => {
    if (address && chain?.blockExplorers?.default?.url) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank');
    }
  };

  // Connection Dialog
  if (!isConnected) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2 min-w-[140px]">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect Your Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to access Web3 features like social sharing and NFT collection.
            </p>
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => handleConnect(connector)}
                disabled={isPending}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{connector.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {isPending ? 'Connecting...' : 'Click to connect'}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected State
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white",
              isOnSupportedNetwork ? currentNetwork.color : "bg-gray-500"
            )}>
              {isOnSupportedNetwork ? currentNetwork.icon : <Wallet className="h-4 w-4" />}
            </div>
            <span>Wallet Connected</span>
          </div>
          <Badge 
            variant={isOnSupportedNetwork ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOnSupportedNetwork ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isOnSupportedNetwork ? currentNetwork.shortName : 'Unsupported'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium">Address</div>
              <code className="text-sm text-muted-foreground font-mono">
                {formatAddress(address!)}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium">Network</div>
              <div className="text-sm text-muted-foreground">
                {chain?.name || 'Unknown Network'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNetworkDialogOpen(true)}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Switch
            </Button>
          </div>
        </div>

        {/* Network Status */}
        {!isOnSupportedNetwork && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're on an unsupported network. Switch to a supported network to access all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Features Available */}
        {isOnSupportedNetwork && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Features</div>
            <div className="flex flex-wrap gap-1">
              {currentNetwork.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openExplorer}
            className="flex-1"
            disabled={!chain?.blockExplorers?.default?.url}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Explorer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>

        {/* Network Switch Dialog */}
        <Dialog open={isNetworkDialogOpen} onOpenChange={setIsNetworkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Switch Network</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a network to access different features and capabilities.
              </p>
              {Object.values(SUPPORTED_NETWORKS).map((network) => {
                const isCurrentNetwork = chain?.id === network.id;
                return (
                  <Button
                    key={network.id}
                    variant={isCurrentNetwork ? "default" : "outline"}
                    className="w-full justify-between h-auto p-4"
                    onClick={() => handleNetworkSwitch(network.id)}
                    disabled={isCurrentNetwork || isSwitching}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white",
                        network.color
                      )}>
                        {network.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{network.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {network.features.join(' • ')}
                        </div>
                      </div>
                    </div>
                    {isCurrentNetwork ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};