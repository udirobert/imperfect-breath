import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Zap, Coins, Users, Sparkles } from "lucide-react";

export type BlockchainType = "lens" | "flow" | "ethereum" | "arbitrum" | "base";

export interface BlockchainOption {
  value: BlockchainType;
  label: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  gasEstimate?: string;
  chainId?: number;
}

interface BlockchainSelectorProps {
  value: BlockchainType;
  onChange: (blockchain: BlockchainType) => void;
  disabled?: boolean;
  showFeatures?: boolean;
  compact?: boolean;
  filter?: (option: BlockchainOption) => boolean;
}

const blockchainOptions: BlockchainOption[] = [
  {
    value: "lens",
    label: "Lens Protocol",
    description: "Decentralized social features and community engagement",
    icon: <Users className="h-4 w-4" />,
    features: ["Social sharing", "Community features", "Profile integration", "Low fees"],
    recommended: true,
    gasEstimate: "~$0.01",
    chainId: 37111,
  },
  {
    value: "flow",
    label: "Flow Blockchain",
    description: "Optimized for NFTs and creator economy",
    icon: <Sparkles className="h-4 w-4" />,
    features: ["NFT minting", "Creator royalties", "Low environmental impact", "Fast transactions"],
    gasEstimate: "~$0.001",
    chainId: 16,
  },
  {
    value: "ethereum",
    label: "Ethereum",
    description: "Most established ecosystem with maximum compatibility",
    icon: <Coins className="h-4 w-4" />,
    features: ["Maximum compatibility", "Largest ecosystem", "High security", "DeFi integration"],
    gasEstimate: "~$5-50",
    chainId: 1,
  },
  {
    value: "arbitrum",
    label: "Arbitrum",
    description: "Ethereum L2 with reduced fees and faster transactions",
    icon: <Zap className="h-4 w-4" />,
    features: ["Low fees", "Fast transactions", "Ethereum compatible", "Growing ecosystem"],
    gasEstimate: "~$0.10",
    chainId: 42161,
  },
  {
    value: "base",
    label: "Base",
    description: "Coinbase L2 with easy fiat on-ramps",
    icon: <Coins className="h-4 w-4" />,
    features: ["Easy fiat access", "Coinbase integration", "Low fees", "User-friendly"],
    gasEstimate: "~$0.05",
    chainId: 8453,
  },
];

export const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showFeatures = true,
  compact = false,
  filter,
}) => {
  const filteredOptions = filter
    ? blockchainOptions.filter(filter)
    : blockchainOptions;

  const selectedOption = blockchainOptions.find(option => option.value === value);

  if (compact) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center gap-2">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
                {selectedOption.recommended && (
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.gasEstimate}
                  </div>
                </div>
                {option.recommended && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    Recommended
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOptions.map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              value === option.value
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && onChange(option.value)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <CardTitle className="text-base">{option.label}</CardTitle>
                </div>
                {option.recommended && (
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {option.description}
              </CardDescription>
            </CardHeader>
            {showFeatures && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gas estimate:</span>
                    <span className="font-medium">{option.gasEstimate}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {option.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {option.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{option.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {selectedOption && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {selectedOption.icon}
            <span className="font-medium">Selected: {selectedOption.label}</span>
            {selectedOption.recommended && (
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {selectedOption.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedOption.features.map((feature, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainSelector;
