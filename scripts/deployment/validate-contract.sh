#!/bin/bash

# Imperfect Breath - Contract Validation Script
# This script validates the Cadence contract syntax before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🌬️  Imperfect Breath - Contract Validation"
echo "=========================================="

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo -e "${RED}❌ Flow CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://developers.flow.com/tools/flow-cli/install"
    exit 1
fi

echo -e "${GREEN}✅ Flow CLI found ($(flow version | head -1))${NC}"

# Check if contract file exists
CONTRACT_PATH="cadence/contracts/ImperfectBreath.cdc"
if [ ! -f "$CONTRACT_PATH" ]; then
    echo -e "${RED}❌ Contract file not found: $CONTRACT_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract file found${NC}"

# Validate contract syntax using Flow CLI
echo -e "${YELLOW}🔍 Validating contract syntax...${NC}"

# Create a temporary flow.json for validation if one doesn't exist
TEMP_FLOW_JSON=false
if [ ! -f "flow.json" ]; then
    echo -e "${YELLOW}📝 Creating temporary flow.json for validation...${NC}"
    cat > flow.json << 'EOF'
{
  "contracts": {
    "ImperfectBreath": {
      "source": "cadence/contracts/ImperfectBreath.cdc"
    }
  },
  "networks": {
    "emulator": "127.0.0.1:3569"
  },
  "accounts": {
    "emulator-account": {
      "address": "f8d6e0586b0a20c7",
      "key": {
        "type": "hex",
        "index": 0,
        "signatureAlgorithm": "ECDSA_P256",
        "hashAlgorithm": "SHA3_256",
        "privateKey": "2eae2f31cb5b756151fa11d82949c634b8f28796a711d7eb1e52cc301ed11111"
      }
    }
  }
}
EOF
    TEMP_FLOW_JSON=true
fi

# Function to validate contract
validate_contract() {
    echo "Checking contract compilation..."

    # Try to parse the contract
    if flow cadence parse "$CONTRACT_PATH" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Contract syntax is valid${NC}"
        return 0
    else
        echo -e "${RED}❌ Contract syntax errors found:${NC}"
        flow cadence parse "$CONTRACT_PATH"
        return 1
    fi
}

# Function to check contract structure
check_contract_structure() {
    echo -e "${YELLOW}🔍 Checking contract structure...${NC}"

    local issues=0

    # Check for required components
    if ! grep -q "access(all) contract ImperfectBreath" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Contract declaration not found${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ Contract declaration found${NC}"
    fi

    if ! grep -q "access(all) resource NFT" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ NFT resource not found${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ NFT resource found${NC}"
    fi

    if ! grep -q "access(all) resource Collection" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Collection resource not found${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ Collection resource found${NC}"
    fi

    if ! grep -q "access(all) resource Marketplace" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Marketplace resource not found${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ Marketplace resource found${NC}"
    fi

    # Check for init function
    if ! grep -q "init()" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Contract init function not found${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ Contract init function found${NC}"
    fi

    # Check for events
    if ! grep -q "access(all) event" "$CONTRACT_PATH"; then
        echo -e "${YELLOW}⚠️  No events found (recommended to have events)${NC}"
    else
        echo -e "${GREEN}✅ Events found${NC}"
    fi

    return $issues
}

# Function to check Cadence 1.0 compatibility
check_cadence_compatibility() {
    echo -e "${YELLOW}🔍 Checking Cadence 1.0 compatibility...${NC}"

    local issues=0

    # Check for old syntax patterns
    if grep -q "pub " "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Old 'pub' keyword found - should use 'access(all)'${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ No old 'pub' keywords found${NC}"
    fi

    if grep -q "destroy()" "$CONTRACT_PATH"; then
        echo -e "${RED}❌ Custom destroy() function found - not allowed in Cadence 1.0${NC}"
        ((issues++))
    else
        echo -e "${GREEN}✅ No custom destroy() functions${NC}"
    fi

    if grep -q "AuthAccount" "$CONTRACT_PATH"; then
        echo -e "${YELLOW}⚠️  AuthAccount usage found - should use new auth() syntax${NC}"
    else
        echo -e "${GREEN}✅ No old AuthAccount usage${NC}"
    fi

    return $issues
}

# Function to analyze contract features
analyze_features() {
    echo -e "${YELLOW}📊 Analyzing contract features...${NC}"

    # Count different components
    local nft_functions=$(grep -c "fun.*NFT\|fun.*Pattern" "$CONTRACT_PATH" || true)
    local marketplace_functions=$(grep -c "fun.*list\|fun.*purchase\|fun.*remove" "$CONTRACT_PATH" || true)
    local events=$(grep -c "access(all) event" "$CONTRACT_PATH" || true)

    echo "Contract Statistics:"
    echo "- NFT-related functions: $nft_functions"
    echo "- Marketplace functions: $marketplace_functions"
    echo "- Events defined: $events"

    # Check for advanced features
    if grep -q "sessionHistory" "$CONTRACT_PATH"; then
        echo -e "${GREEN}✅ Session tracking feature found${NC}"
    fi

    if grep -q "phases.*UInt64" "$CONTRACT_PATH"; then
        echo -e "${GREEN}✅ Breathing phases structure found${NC}"
    fi

    if grep -q "audioUrl" "$CONTRACT_PATH"; then
        echo -e "${GREEN}✅ Audio URL support found${NC}"
    fi
}

# Main validation process
main() {
    echo ""

    # Step 1: Basic syntax validation
    if ! validate_contract; then
        echo -e "${RED}❌ Contract validation failed - fix syntax errors first${NC}"
        cleanup_and_exit 1
    fi

    echo ""

    # Step 2: Structure validation
    check_contract_structure
    structure_issues=$?

    echo ""

    # Step 3: Cadence 1.0 compatibility
    check_cadence_compatibility
    compatibility_issues=$?

    echo ""

    # Step 4: Feature analysis
    analyze_features

    echo ""
    echo "=========================================="

    # Summary
    total_issues=$((structure_issues + compatibility_issues))

    if [ $total_issues -eq 0 ]; then
        echo -e "${GREEN}🎉 Contract validation passed!${NC}"
        echo -e "${GREEN}✅ Ready for deployment to testnet${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Run: ./scripts/deployment/deploy-testnet.sh"
        echo "2. Or manually deploy with: flow project deploy --network testnet"
        cleanup_and_exit 0
    else
        echo -e "${YELLOW}⚠️  Contract validation completed with $total_issues issues${NC}"
        echo "Please review the issues above before deployment."
        echo ""
        echo "The contract may still deploy, but fixing these issues is recommended."
        cleanup_and_exit 1
    fi
}

# Cleanup function
cleanup_and_exit() {
    if [ "$TEMP_FLOW_JSON" = true ]; then
        rm -f flow.json
        echo -e "${BLUE}🧹 Temporary flow.json removed${NC}"
    fi
    exit $1
}

# Handle script interruption
trap 'cleanup_and_exit 130' INT

# Run main function
main "$@"
