import React from 'react';
import { useAccount } from 'wagmi';
import { useLensService } from '@/hooks/useLensService';
import { WalletConnection } from '@/components/wallet/WalletConnection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { lensTestnet } from '@/lib/wagmi/chains';

export const LensConnectionTest: React.FC = () => {
  const { 
    profile, 
    isLoading, 
    error, 
    isAuthenticated, 
    authenticate, 
    logout,
    publishSession 
  } = useLensService();
  
  const { isConnected, chain } = useAccount();
  const isOnLensTestnet = chain?.id === lensTestnet.id;

  const handleConnect = async () => {
    try {
      await authenticate();
      toast.success('Connected to Lens!');
    } catch (error) {
      toast.error('Failed to connect to Lens');
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      toast.success('Disconnected from Lens');
    } catch (error) {
      toast.error('Failed to disconnect from Lens');
    }
  };

  const handleTestPost = async () => {
    try {
      const testSessionData = {
        patternName: 'Box Breathing',
        duration: 300, // 5 minutes
        score: 85,
        cycles: 10,
        breathHoldTime: 15,
      };

      const txHash = await publishSession(testSessionData);
      toast.success('Test session posted!', {
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      });
    } catch (error) {
      toast.error('Failed to post test session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <WalletConnection />
      
      {/* Lens Integration Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Lens Protocol Integration Test
            {isAuthenticated ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Connection Status</h4>
          <div className="text-sm text-muted-foreground">
            {!isConnected ? (
              <p>❌ Wallet not connected</p>
            ) : !isOnLensTestnet ? (
              <p>⚠️ Please switch to Lens Testnet</p>
            ) : isAuthenticated ? (
              <div className="space-y-1">
                <p>✅ Successfully connected to Lens Protocol</p>
                {profile && (
                  <>
                    <p>📍 Address: {profile.address}</p>
                    <p>👤 Username: {profile.username || 'Not set'}</p>
                  </>
                )}
              </div>
            ) : (
              <p>🔗 Ready to connect to Lens Protocol</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            Error: {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isConnected || !isOnLensTestnet ? (
            <Button 
              disabled
              className="flex-1"
              variant="outline"
            >
              {!isConnected ? 'Connect Wallet First' : 'Switch to Lens Testnet'}
            </Button>
          ) : !isAuthenticated ? (
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Lens'
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleDisconnect} 
                variant="outline"
                disabled={isLoading}
              >
                Disconnect
              </Button>
              <Button 
                onClick={handleTestPost} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Test Post Session'
                )}
              </Button>
            </>
          )}
        </div>

        {/* Integration Notes */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <p className="font-medium mb-1">Integration Notes:</p>
          <ul className="space-y-1">
            <li>• Using Lens Protocol TypeScript SDK (canary)</li>
            <li>• Connected to Lens Chain testnet</li>
            <li>• Real wagmi wallet integration</li>
            <li>• Grove storage for metadata</li>
            <li>• Posts created with breathing session metadata</li>
          </ul>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};