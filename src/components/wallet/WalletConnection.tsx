import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, Copy, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { lensTestnet } from '@/lib/wagmi/chains';
import { Connector } from 'wagmi';

interface WalletConnectionProps {
  autoOpen?: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ autoOpen = false }) => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
const { data: walletClient } = useWalletClient();
const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [isDialogOpen, setIsDialogOpen] = useState(autoOpen);

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    setIsDialogOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const switchToLensTestnet = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: lensTestnet.id });
      } else if (walletClient) {
        await walletClient.switchChain({ id: lensTestnet.id });
      } else {
        throw new Error('No wallet client available');
      }
      toast.success('Switched to Lens Testnet');
    } catch (error) {
      console.error('Failed to switch chain:', error);
      toast.error('Failed to switch to Lens Testnet');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isOnLensTestnet = chain?.id === lensTestnet.id;

  if (!isConnected) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
              isOnLensTestnet ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isOnLensTestnet ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
            <span>Wallet Connected</span>
          </div>
          <Badge 
            variant={isOnLensTestnet ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOnLensTestnet ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isOnLensTestnet ? 'Lens Testnet' : 'Wrong Network'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Address and Network Info */}
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
          </div>
        </div>

        {/* Network Status */}
        {!isOnLensTestnet && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Network Required</p>
              <p className="text-yellow-700 mt-1">
                Switch to Lens Testnet to use all features
              </p>
              <Button
                onClick={switchToLensTestnet}
                size="sm"
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
              >
                Switch to Lens Testnet
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${chain?.blockExplorers?.default?.url}/address/${address}`, '_blank')}
            className="flex-1"
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

        {/* Lens Integration Status */}
        {isOnLensTestnet && (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Ready for Web3</p>
              <p className="text-green-700 mt-1">
                Your wallet is connected to Lens Testnet and ready to use social features
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};