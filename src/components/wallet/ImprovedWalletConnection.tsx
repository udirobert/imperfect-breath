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
  };\n\n  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };\n\n  const openExplorer = () => {
    if (address && chain?.blockExplorers?.default?.url) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank');
    }
  };\n\n  // Connection Dialog\n  if (!isConnected) {
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
  }\n\n  // Connected State\n  return (\n    <Card className=\"w-full max-w-md mx-auto\">\n      <CardHeader className=\"pb-3\">\n        <CardTitle className=\"flex items-center justify-between text-lg\">\n          <div className=\"flex items-center gap-2\">\n            <div className={cn(\n              \"w-8 h-8 rounded-full flex items-center justify-center text-white\",\n              isOnSupportedNetwork ? currentNetwork.color : \"bg-gray-500\"\n            )}>\n              {isOnSupportedNetwork ? currentNetwork.icon : <Wallet className=\"h-4 w-4\" />}\n            </div>\n            <span>Wallet Connected</span>\n          </div>\n          <Badge \n            variant={isOnSupportedNetwork ? \"default\" : \"destructive\"}\n            className=\"flex items-center gap-1\"\n          >\n            {isOnSupportedNetwork ? (\n              <CheckCircle className=\"h-3 w-3\" />\n            ) : (\n              <XCircle className=\"h-3 w-3\" />\n            )}\n            {isOnSupportedNetwork ? currentNetwork.shortName : 'Unsupported'}\n          </Badge>\n        </CardTitle>\n      </CardHeader>\n\n      <CardContent className=\"space-y-4\">\n        {/* Address Section */}\n        <div className=\"space-y-3\">\n          <div className=\"flex items-center justify-between p-3 bg-muted/50 rounded-lg\">\n            <div>\n              <div className=\"text-sm font-medium\">Address</div>\n              <code className=\"text-sm text-muted-foreground font-mono\">\n                {formatAddress(address!)}\n              </code>\n            </div>\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={copyAddress}\n              className=\"h-8 w-8 p-0\"\n            >\n              <Copy className=\"h-3 w-3\" />\n            </Button>\n          </div>\n\n          <div className=\"flex items-center justify-between p-3 bg-muted/50 rounded-lg\">\n            <div>\n              <div className=\"text-sm font-medium\">Network</div>\n              <div className=\"text-sm text-muted-foreground\">\n                {chain?.name || 'Unknown Network'}\n              </div>\n            </div>\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={() => setIsNetworkDialogOpen(true)}\n              className=\"h-8 px-2\"\n            >\n              <RefreshCw className=\"h-3 w-3 mr-1\" />\n              Switch\n            </Button>\n          </div>\n        </div>\n\n        {/* Network Status */}\n        {!isOnSupportedNetwork && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're on an unsupported network. Switch to a supported network to access all features.
            </AlertDescription>
          </Alert>
        )}\n\n        {/* Features Available */}\n        {isOnSupportedNetwork && (\n          <div className=\"space-y-2\">\n            <div className=\"text-sm font-medium\">Available Features</div>\n            <div className=\"flex flex-wrap gap-1\">\n              {currentNetwork.features.map((feature) => (\n                <Badge key={feature} variant=\"secondary\" className=\"text-xs\">\n                  {feature}\n                </Badge>\n              ))}\n            </div>\n          </div>\n        )}\n\n        {/* Actions */}\n        <div className=\"flex gap-2\">\n          <Button\n            variant=\"outline\"\n            size=\"sm\"\n            onClick={openExplorer}\n            className=\"flex-1\"\n            disabled={!chain?.blockExplorers?.default?.url}\n          >\n            <ExternalLink className=\"h-3 w-3 mr-1\" />\n            Explorer\n          </Button>\n          <Button\n            variant=\"destructive\"\n            size=\"sm\"\n            onClick={handleDisconnect}\n            className=\"flex-1\"\n          >\n            Disconnect\n          </Button>\n        </div>\n\n        {/* Network Switch Dialog */}\n        <Dialog open={isNetworkDialogOpen} onOpenChange={setIsNetworkDialogOpen}>\n          <DialogContent className=\"sm:max-w-md\">\n            <DialogHeader>\n              <DialogTitle>Switch Network</DialogTitle>\n            </DialogHeader>\n            <div className=\"space-y-3\">\n              <p className=\"text-sm text-muted-foreground\">\n                Choose a network to access different features and capabilities.\n              </p>\n              {Object.values(SUPPORTED_NETWORKS).map((network) => {\n                const isCurrentNetwork = chain?.id === network.id;\n                return (\n                  <Button\n                    key={network.id}\n                    variant={isCurrentNetwork ? \"default\" : \"outline\"}\n                    className=\"w-full justify-between h-auto p-4\"\n                    onClick={() => handleNetworkSwitch(network.id)}\n                    disabled={isCurrentNetwork || isSwitching}\n                  >\n                    <div className=\"flex items-center gap-3\">\n                      <div className={cn(\n                        \"w-8 h-8 rounded-full flex items-center justify-center text-white\",\n                        network.color\n                      )}>\n                        {network.icon}\n                      </div>\n                      <div className=\"text-left\">\n                        <div className=\"font-medium\">{network.name}</div>\n                        <div className=\"text-xs text-muted-foreground\">\n                          {network.features.join(' • ')}\n                        </div>\n                      </div>\n                    </div>\n                    {isCurrentNetwork ? (\n                      <CheckCircle className=\"h-4 w-4\" />\n                    ) : (\n                      <ChevronRight className=\"h-4 w-4\" />\n                    )}\n                  </Button>\n                );\n              })}\n            </div>\n          </DialogContent>\n        </Dialog>\n      </CardContent>\n    </Card>\n  );\n};