import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, ChevronDown, Copy, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { lensTestnet } from '@/lib/wagmi/chains';

export const WalletConnection: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConnect = (connector: any) => {
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
    if (!walletClient) return;

    try {
      await walletClient.switchChain({ id: lensTestnet.id });
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
                className="w-full justify-start"
                onClick={() => handleConnect(connector)}
                disabled={isPending}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {connector.name}
                {isPending && ' (Connecting...)'}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </span>
          {isOnLensTestnet ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Lens Testnet
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Wrong Network
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {formatAddress(address!)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className="text-sm font-medium">
              {chain?.name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Network Switch */}
        {!isOnLensTestnet && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Switch to Lens Testnet to use Lens features
            </p>
            <Button
              onClick={switchToLensTestnet}
              variant="outline"
              className="w-full"
            >
              Switch to Lens Testnet
            </Button>
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Ready for Lens Protocol integration
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};