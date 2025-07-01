#!/bin/bash

# Imperfect Breath - Flow Testnet Deployment Script
# This script helps deploy the ImperfectBreath contract to Flow testnet

set -e

echo "🌬️  Imperfect Breath - Flow Testnet Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo -e "${RED}❌ Flow CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://developers.flow.com/tools/flow-cli/install"
    exit 1
fi

echo -e "${GREEN}✅ Flow CLI found ($(flow version | head -1))${NC}"

# Function to generate keys
generate_keys() {
    echo -e "${YELLOW}🔑 Generating new keys...${NC}"
    KEY_OUTPUT=$(flow keys generate --output json 2>/dev/null || flow keys generate)

    if [[ $KEY_OUTPUT == *"Private Key"* ]]; then
        # Parse text output
        PRIVATE_KEY=$(echo "$KEY_OUTPUT" | grep "Private Key" | awk '{print $3}')
        PUBLIC_KEY=$(echo "$KEY_OUTPUT" | grep "Public Key" | awk '{print $3}')
    else
        # Parse JSON output
        PRIVATE_KEY=$(echo "$KEY_OUTPUT" | grep -o '"private":"[^"]*"' | cut -d'"' -f4)
        PUBLIC_KEY=$(echo "$KEY_OUTPUT" | grep -o '"public":"[^"]*"' | cut -d'"' -f4)
    fi

    echo -e "${GREEN}✅ Keys generated${NC}"
    echo -e "${RED}⚠️  IMPORTANT: Keep your private key safe!${NC}"
}

# Function to update flow.json
update_flow_config() {
    local address=$1
    local private_key=$2

    echo -e "${YELLOW}🔧 Updating flow.json configuration...${NC}"

    # Create backup
    cp flow.json flow.json.backup

    # Create new flow.json with testnet configuration
    cat > flow.json << EOF
{
  "contracts": {
    "ImperfectBreath": {
      "source": "cadence/contracts/ImperfectBreath.cdc"
    }
  },
  "networks": {
    "emulator": "127.0.0.1:3569",
    "testnet": "access.devnet.nodes.onflow.org:9000",
    "mainnet": "access.mainnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "testnet-account": {
      "address": "$address",
      "key": {
        "type": "hex",
        "index": 0,
        "signatureAlgorithm": "ECDSA_P256",
        "hashAlgorithm": "SHA3_256",
        "privateKey": "$private_key"
      }
    }
  },
  "deployments": {
    "testnet": {
      "testnet-account": ["ImperfectBreath"]
    }
  }
}
EOF

    echo -e "${GREEN}✅ flow.json updated${NC}"
}

# Function to deploy contract
deploy_contract() {
    echo -e "${YELLOW}🚀 Deploying contract to testnet...${NC}"

    if flow project deploy --network testnet; then
        echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        return 1
    fi
}

# Function to test contract
test_contract() {
    local address=$1
    echo -e "${YELLOW}🧪 Testing contract deployment...${NC}"

    # Test setup account transaction
    if flow transactions send cadence/transactions/setup_account.cdc \
        --network testnet \
        --signer testnet-account; then
        echo -e "${GREEN}✅ Account setup successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Account setup test failed (may already be set up)${NC}"
    fi
}

# Main execution flow
main() {
    echo ""
    echo "This script will help you deploy ImperfectBreath to Flow testnet."
    echo ""

    # Step 1: Generate or use existing keys
    if [ -f ".deployment-keys" ]; then
        echo -e "${BLUE}🔑 Found existing keys${NC}"
        source .deployment-keys
    else
        generate_keys
        # Save keys for reuse
        cat > .deployment-keys << EOF
PRIVATE_KEY="$PRIVATE_KEY"
PUBLIC_KEY="$PUBLIC_KEY"
EOF
        chmod 600 .deployment-keys
    fi

    echo -e "${BLUE}📋 Your public key:${NC}"
    echo "$PUBLIC_KEY"
    echo ""

    # Step 2: Get testnet account
    echo -e "${YELLOW}🚰 Testnet Account Setup${NC}"
    echo "1. Visit: https://testnet-faucet.onflow.org/"
    echo "2. Paste your public key: $PUBLIC_KEY"
    echo "3. Click 'Create Account' to get testnet FLOW tokens"
    echo "4. Copy the account address"
    echo ""

    while true; do
        read -p "Enter your testnet account address (0x...): " TESTNET_ADDRESS

        if [ -z "$TESTNET_ADDRESS" ]; then
            echo -e "${RED}❌ No address provided${NC}"
            continue
        fi

        # Validate address format
        if [[ ! $TESTNET_ADDRESS =~ ^0x[a-fA-F0-9]{16}$ ]]; then
            echo -e "${RED}❌ Invalid address format. Should be 0x followed by 16 hex characters${NC}"
            continue
        fi

        echo -e "${GREEN}✅ Valid address format${NC}"
        break
    done

    # Step 3: Update configuration
    update_flow_config "$TESTNET_ADDRESS" "$PRIVATE_KEY"

    # Step 4: Deploy contract
    if deploy_contract; then
        echo ""
        echo -e "${BLUE}📝 Deployment Summary:${NC}"
        echo "- Contract: ImperfectBreath"
        echo "- Network: Flow Testnet"
        echo "- Account: $TESTNET_ADDRESS"
        echo "- Explorer: https://testnet.flowscan.org/account/$TESTNET_ADDRESS"
        echo ""

        # Step 5: Test deployment
        test_contract "$TESTNET_ADDRESS"

        # Save deployment info
        cat > deployment-info.txt << EOF
Imperfect Breath - Testnet Deployment
=====================================
Date: $(date)
Contract: ImperfectBreath
Network: Flow Testnet
Account: $TESTNET_ADDRESS
Explorer: https://testnet.flowscan.org/account/$TESTNET_ADDRESS

Environment Variables for Frontend:
VITE_FLOW_NETWORK=testnet
VITE_FLOW_ACCESS_API=https://rest-testnet.onflow.org
VITE_IMPERFECT_BREATH_ADDRESS=$TESTNET_ADDRESS

Next Steps:
1. Update your .env file with the above variables
2. Test contract functions through your frontend
3. Set up user account collections
4. Begin testing NFT minting and marketplace
EOF

        echo -e "${BLUE}📄 Deployment info saved to deployment-info.txt${NC}"
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"

    else
        echo ""
        echo -e "${RED}❌ Deployment failed. Common issues:${NC}"
        echo "- Insufficient testnet FLOW balance (visit faucet again)"
        echo "- Network connectivity issues"
        echo "- Contract syntax errors"
        echo "- Invalid account configuration"
        echo ""
        echo "Check the error messages above and try again."
        exit 1
    fi

    # Cleanup prompt
    echo ""
    read -p "Remove sensitive key files? (recommended) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f .deployment-keys
        echo -e "${GREEN}✅ Sensitive files removed${NC}"
    else
        echo -e "${YELLOW}⚠️  Keys saved in .deployment-keys (keep secure!)${NC}"
    fi

    echo ""
    echo -e "${GREEN}🌬️  Ready to breathe on the blockchain! 🎉${NC}"
}

# Run main function
main "$@"
