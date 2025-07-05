import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Shield, 
  Coins, 
  Users, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Copyright,
  Banknote,
  Share2,
  Award
} from 'lucide-react';
import { useStory } from '@/hooks/useStory';
import { useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';

export const StoryIPHub: React.FC = () => {
  // Form states
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');
  const [inhale, setInhale] = useState(4);
  const [hold, setHold] = useState(7);
  const [exhale, setExhale] = useState(8);
  const [rest, setRest] = useState(2);
  const [isCommercial, setIsCommercial] = useState(false);
  const [revShare, setRevShare] = useState([10]);
  const [mintingFee, setMintingFee] = useState([0.01]);

  // License and royalty states
  const [targetIpId, setTargetIpId] = useState('');
  const [licenseTermsId, setLicenseTermsId] = useState('');
  const [royaltyAmount, setRoyaltyAmount] = useState('');

  // Results
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [licenseResult, setLicenseResult] = useState<any>(null);

  const { address } = useAccount();
  const { ip, licensing, royalties, isLoading, error } = useStory();

  const handleRegisterPattern = async () => {
    if (!patternName.trim() || !patternDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in pattern name and description.",
        variant: "destructive"
      });
      return;
    }

    try {
      const patternData = {
        name: patternName,
        description: patternDescription,
        inhale,
        hold,
        exhale,
        rest,
        creator: address!,
        tags: ['breathing', 'wellness', 'meditation']
      };

      let result;
      if (isCommercial) {
        result = await licensing.registerCommercialPattern(
          patternData,
          revShare[0],
          mintingFee[0]
        );
      } else {
        result = await licensing.registerNonCommercialPattern(patternData);
      }

      setRegistrationResult(result);
      
      toast({
        title: "Pattern registered as IP!",
        description: `Your breathing pattern has been registered on Story Protocol. IP ID: ${result?.ipId.slice(0, 10)}...`,
      });

      // Clear form
      setPatternName('');
      setPatternDescription('');
      setInhale(4);
      setHold(7);
      setExhale(8);
      setRest(2);
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Failed to register IP",
        variant: "destructive"
      });
    }
  };

  const handleMintLicense = async () => {
    if (!targetIpId.trim() || !licenseTermsId.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide IP ID and License Terms ID.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await licensing.purchasePatternLicense(targetIpId, licenseTermsId, 1);
      setLicenseResult(result);
      
      toast({
        title: "License purchased!",
        description: `You now have a license to use this breathing pattern. Token ID: ${result?.licenseTokenIds[0]}`,
      });
    } catch (err) {
      toast({
        title: "License purchase failed",
        description: err instanceof Error ? err.message : "Failed to purchase license",
        variant: "destructive"
      });
    }
  };

  const handlePayRoyalties = async () => {
    if (!targetIpId.trim() || !royaltyAmount.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide IP ID and royalty amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(royaltyAmount);
      const result = await royalties.tipCreator(targetIpId, amount);
      
      toast({
        title: "Royalty paid!",
        description: `Successfully paid ${amount} $WIP to the creator. TX: ${result?.txHash.slice(0, 10)}...`,
      });

      setRoyaltyAmount('');
    } catch (err) {
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : "Failed to pay royalties",
        variant: "destructive"
      });
    }
  };

  const handleClaimRevenue = async () => {
    if (!targetIpId.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your IP ID to claim revenue.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await royalties.claimPatternRevenue(targetIpId);
      
      toast({
        title: "Revenue claimed!",
        description: `Successfully claimed revenue. Tokens: ${result?.claimedTokens.length || 0}`,
      });
    } catch (err) {
      toast({
        title: "Claim failed",
        description: err instanceof Error ? err.message : "Failed to claim revenue",
        variant: "destructive"
      });
    }
  };

  if (!address) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Story Protocol IP Hub
          </CardTitle>
          <CardDescription>
            Connect your wallet to register breathing patterns as intellectual property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Wallet connection required for IP registration
            </p>
            <Badge variant="outline">Connect Wallet to Continue</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Story Protocol IP Hub
          </CardTitle>
          <CardDescription>
            Register breathing patterns as intellectual property, create licenses, and manage royalties
          </CardDescription>
          <div className="flex gap-2">
            <Badge variant="secondary">Connected: {address.slice(0, 8)}...</Badge>
            <Badge variant="outline">Story Testnet</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Interface */}
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="register">Register IP</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
          <TabsTrigger value="royalties">Royalties</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Register Breathing Pattern as IP
              </CardTitle>
              <CardDescription>
                Create an IP Asset for your breathing pattern with customizable licensing terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pattern Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern-name">Pattern Name</Label>
                  <Input
                    id="pattern-name"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    placeholder="e.g., Calming 4-7-8 Breath"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pattern Timing</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Inhale</Label>
                      <Input
                        type="number"
                        value={inhale}
                        onChange={(e) => setInhale(parseInt(e.target.value) || 0)}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hold</Label>
                      <Input
                        type="number"
                        value={hold}
                        onChange={(e) => setHold(parseInt(e.target.value) || 0)}
                        min="0"
                        max="30"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Exhale</Label>
                      <Input
                        type="number"
                        value={exhale}
                        onChange={(e) => setExhale(parseInt(e.target.value) || 0)}
                        min="1"
                        max="30"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rest</Label>
                      <Input
                        type="number"
                        value={rest}
                        onChange={(e) => setRest(parseInt(e.target.value) || 0)}
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern-description">Description</Label>
                <Textarea
                  id="pattern-description"
                  value={patternDescription}
                  onChange={(e) => setPatternDescription(e.target.value)}
                  placeholder="Describe your breathing pattern, its benefits, and intended use..."
                  rows={3}
                />
              </div>

              {/* License Configuration */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="commercial-use">Commercial Use</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to use your pattern commercially
                    </p>
                  </div>
                  <Switch
                    id="commercial-use"
                    checked={isCommercial}
                    onCheckedChange={setIsCommercial}
                  />
                </div>

                {isCommercial && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-200">
                    <div className="space-y-2">
                      <Label>Revenue Share: {revShare[0]}%</Label>
                      <Slider
                        value={revShare}
                        onValueChange={setRevShare}
                        max={50}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentage of revenue you'll receive from derivatives
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Minting Fee: {mintingFee[0]} $WIP</Label>
                      <Slider
                        value={mintingFee}
                        onValueChange={setMintingFee}
                        max={1}
                        min={0}
                        step={0.01}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cost for others to license your pattern
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleRegisterPattern}
                disabled={isLoading || !patternName.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering IP...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Register as IP Asset
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                License Management
              </CardTitle>
              <CardDescription>
                Purchase licenses to use breathing patterns or create derivatives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-ip">IP Asset ID</Label>
                  <Input
                    id="target-ip"
                    value={targetIpId}
                    onChange={(e) => setTargetIpId(e.target.value)}
                    placeholder="0x1234..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license-terms">License Terms ID</Label>
                  <Input
                    id="license-terms"
                    value={licenseTermsId}
                    onChange={(e) => setLicenseTermsId(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <Button
                onClick={handleMintLicense}
                disabled={isLoading || !targetIpId.trim() || !licenseTermsId.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Purchasing License...
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Purchase License
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="royalties" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Pay Royalties
                </CardTitle>
                <CardDescription>
                  Tip creators or pay due royalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="royalty-ip">IP Asset ID</Label>
                  <Input
                    id="royalty-ip"
                    value={targetIpId}
                    onChange={(e) => setTargetIpId(e.target.value)}
                    placeholder="0x1234..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="royalty-amount">Amount ($WIP)</Label>
                  <Input
                    id="royalty-amount"
                    type="number"
                    value={royaltyAmount}
                    onChange={(e) => setRoyaltyAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    min="0"
                  />
                </div>

                <Button
                  onClick={handlePayRoyalties}
                  disabled={isLoading || !targetIpId.trim() || !royaltyAmount.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Paying...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Pay Royalties
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Claim Revenue
                </CardTitle>
                <CardDescription>
                  Claim earned royalties from your IP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claim-ip">Your IP Asset ID</Label>
                  <Input
                    id="claim-ip"
                    value={targetIpId}
                    onChange={(e) => setTargetIpId(e.target.value)}
                    placeholder="0x1234..."
                  />
                </div>

                <Button
                  onClick={handleClaimRevenue}
                  disabled={isLoading || !targetIpId.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Claim Revenue
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    IP Registration Success
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">IP Asset ID</Label>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {registrationResult.ipId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Token ID</Label>
                    <p className="text-sm">{registrationResult.tokenId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transaction</Label>
                    <p className="text-sm font-mono">{registrationResult.txHash.slice(0, 20)}...</p>
                  </div>
                  {registrationResult.licenseTermsId && (
                    <div>
                      <Label className="text-sm font-medium">License Terms ID</Label>
                      <p className="text-sm">{registrationResult.licenseTermsId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {licenseResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    License Purchase Success
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">License Token IDs</Label>
                    {licenseResult.licenseTokenIds.map((id: string, index: number) => (
                      <p key={index} className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {id}
                      </p>
                    ))}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transaction</Label>
                    <p className="text-sm font-mono">{licenseResult.txHash.slice(0, 20)}...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryIPHub;
