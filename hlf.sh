#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

msg() {
    local message=$1
    printf "${CYAN}[/] %s${NC}\n" "$message"
}

COMMAND=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

function usage() {
    echo -e "${YELLOW}Usage:${NC} ./hlf.sh [command]"
    echo ""
    echo -e "${GREEN}Available commands:${NC}"
    echo -e "  ${GREEN}install${NC}   Install Fabric binaries, Docker images, and samples"
    echo -e "  ${GREEN}start${NC}     Start Hyperledger Fabric test network"
    echo -e "  ${GREEN}deploy${NC}    Deploy the Fabric chaincode (typescript)"
    echo -e "  ${GREEN}run${NC}       Run the Fabric chaincode (typescript)"
    echo -e "  ${GREEN}stop${NC}      Stop the test network"
    echo -e "  ${GREEN}clean${NC}     Remove chaincode containers"
    echo -e "  ${GREEN}help${NC}      Show this help message"
    echo ""
}

function ensure_root_dir() {
    if [[ ! -d "solana-program" || ! -f "install-fabric.sh" ]]; then
        echo -e "${RED}[!] Please run this script from the root of the project (hlf-solana/).${NC}"
        exit 1
    fi
}

function ensure_fabric_samples() {
    if [[ ! -d "fabric-samples" ]]; then
        echo -e "${RED}[!] Please run the install option to set up hyperledger fabric environmnet (fabric-samples/).${NC}"
        exit 1
    fi
}

ensure_root_dir

case "$COMMAND" in
    install)
        msg "Installing Fabric dependencies..."
        ./install-fabric.sh
        ;;
    start)
        ensure_fabric_samples
        msg "Starting Hyperledger Fabric network..."
        "$PROJECT_ROOT/scripts/start-hlf.sh"
        ;;
    deploy)
        ensure_fabric_samples
        msg "Deploying Fabric chaincode..."
        "$PROJECT_ROOT/scripts/deploy-chaincode.sh"
        ;;
    run)
        ensure_fabric_samples
        msg "Running Fabric chaincode..."
        "$PROJECT_ROOT/scripts/run-chaincode.sh"
        ;;
    stop)
        ensure_fabric_samples
        msg "Stopping Hyperledger Fabric network..."
        "$PROJECT_ROOT/scripts/stop-hlf.sh"
        ;;
    clean)
        ensure_fabric_samples
        msg "Cleaning up chaincode containers..."
        "$PROJECT_ROOT/scripts/clear-cc-containers.sh"
        ;;
    help|"")
        usage
        ;;
    *)
        echo -e "${RED}[!] Unknown command: ${COMMAND}${NC}"
        usage
        ;;
esac
