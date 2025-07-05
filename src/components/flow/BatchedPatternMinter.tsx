import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useFlow } from '@/hooks/useFlow';
import { toast } from '@/hooks/use-toast';

interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
}

const PRESET_PATTERNS: BreathingPattern[] = [
  {
    name: "4-7-8 Relaxation",
    description: "Classic calming breath pattern",
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 2
  },
  {
    name: "Box Breathing",
    description: "Equal timing for focus",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4
  },
  {
    name: "Energizing Breath",
    description: "Quick pattern for energy",
    inhale: 3,
    hold: 2,
    exhale: 4,
    rest: 1
  },
  {
    name: "Deep Relaxation",
    description: "Extended pattern for deep calm",
    inhale: 6,
    hold: 6,
    exhale: 8,
    rest: 4
  },
  {
    name: "Quick Reset",
    description: "Fast pattern for busy moments",
    inhale: 2,
    hold: 2,
    exhale: 4,
    rest: 1
  }
];

export const BatchedPatternMinter: React.FC = () => {
  const [selectedPatterns, setSelectedPatterns] = useState<BreathingPattern[]>([]);
  const [randomVariations, setRandomVariations] = useState<BreathingPattern[]>([]);
  const [showResults, setShowResults] = useState(false);

  const {
    isPending,
    isError,
    txId,
    results,
    error,
    batchMintBreathingPatterns,
    generateRandomPattern,
    clearResults
  } = useFlow();

  const { flowAddress, coaAddress, isConnected } = useFlow();

  const togglePatternSelection = (pattern: BreathingPattern) => {
    setSelectedPatterns(prev => {
      const isSelected = prev.some(p => p.name === pattern.name);
      if (isSelected) {
        return prev.filter(p => p.name !== pattern.name);
      } else {
        return [...prev, pattern];
      }
    });
  };

  const generateRandomVariations = async () => {
    if (selectedPatterns.length === 0) {
      toast({
        title: "No patterns selected",
        description: "Please select at least one pattern to generate variations.",
        variant: "destructive"
      });
      return;
    }

    try {
      const variations = await Promise.all(
        selectedPatterns.map(pattern => generateRandomPattern(pattern))
      );
      
      setRandomVariations(variations);
      toast({
        title: "Variations generated!",
        description: `Created ${variations.length} unique pattern variations using Flow VRF.`,
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: "Failed to generate random variations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const mintSelectedPatterns = async () => {
    const patternsToMint = randomVariations.length > 0 ? randomVariations : selectedPatterns;
    
    if (patternsToMint.length === 0) {
      toast({
        title: "No patterns to mint",
        description: "Please select patterns or generate variations first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await batchMintBreathingPatterns(patternsToMint);
      setShowResults(true);
      
      toast({
        title: "Batch minting initiated!",
        description: `Minting ${patternsToMint.length} patterns in a single transaction.`,
      });
    } catch (err) {
      toast({
        title: "Minting failed",
        description: "Failed to mint patterns. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetSelection = () => {
    setSelectedPatterns([]);
    setRandomVariations([]);
    setShowResults(false);
    clearResults();
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Batched Pattern Minting
          </CardTitle>
          <CardDescription>
            Connect your Flow wallet to mint multiple breathing patterns in a single transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Flow wallet required for batched transactions
            </p>
            <Badge variant="outline">Connect Flow Wallet to Continue</Badge>
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
            <Zap className="h-5 w-5 text-blue-500" />
            Batched Pattern Minting
          </CardTitle>
          <CardDescription>
            Mint multiple breathing patterns with a single signature using Flow's cross-VM capabilities
          </CardDescription>
          <div className="flex gap-4 text-sm">
            <Badge variant="secondary">Flow: {flowAddress?.slice(0, 8)}...</Badge>
            {coaAddress && <Badge variant="outline">EVM: {coaAddress.slice(0, 8)}...</Badge>}
          </div>
        </CardHeader>
      </Card>

      {/* Pattern Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Patterns to Mint</CardTitle>
          <CardDescription>
            Choose from preset patterns or generate random variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_PATTERNS.map((pattern) => {
              const isSelected = selectedPatterns.some(p => p.name === pattern.name);
              return (
                <div
                  key={pattern.name}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => togglePatternSelection(pattern)}
                >
                  <h3 className="font-semibold">{pattern.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                  <div className="text-xs space-y-1">
                    <div>Inhale: {pattern.inhale}s | Hold: {pattern.hold}s</div>
                    <div>Exhale: {pattern.exhale}s | Rest: {pattern.rest}s</div>
                  </div>
                  {isSelected && (
                    <Badge className="mt-2" variant="default">Selected</Badge>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={generateRandomVariations}
              disabled={selectedPatterns.length === 0 || isPending}
              variant="outline"
            >
              Generate Random Variations ({selectedPatterns.length})
            </Button>
            <Button onClick={resetSelection} variant="ghost">
              Clear Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Random Variations Display */}
      {randomVariations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Variations (Flow VRF)</CardTitle>
            <CardDescription>
              Unique patterns generated using Flow's native randomness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {randomVariations.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h3 className="font-semibold">{pattern.name}</h3>
                  <div className="text-xs space-y-1 mt-2">
                    <div>Inhale: {pattern.inhale}s | Hold: {pattern.hold}s</div>
                    <div>Exhale: {pattern.exhale}s | Rest: {pattern.rest}s</div>
                    <Badge variant="secondary" className="mt-1">
                      Seed: {(pattern as any).randomSeed}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mint Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to Mint</h3>
              <p className="text-sm text-muted-foreground">
                {randomVariations.length > 0 
                  ? `${randomVariations.length} random variations` 
                  : `${selectedPatterns.length} selected patterns`
                }
              </p>
            </div>
            <Button
              onClick={mintSelectedPatterns}
              disabled={
                (selectedPatterns.length === 0 && randomVariations.length === 0) || 
                isPending
              }
              size="lg"
              className="min-w-[200px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Batch Mint ({randomVariations.length || selectedPatterns.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && (txId || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isError ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Transaction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            
            {txId && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Cadence Transaction</h4>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {txId}
                  </p>
                  <a
                    href={`https://testnet.flowscan.org/transaction/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View on Flowscan →
                  </a>
                </div>

                {results.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">EVM Transactions</h4>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {result.status === 'passed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono">{result.hash}</span>
                          <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchedPatternMinter;
