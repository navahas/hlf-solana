#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

# Find all matching containers
CONTAINER_IDS=$(docker ps -a --format "{{.ID}}\t{{.Names}}" | grep -E "peer0org[0-9]+_basicts_ccaas" | awk '{print $1}')

if [ -n "$CONTAINER_IDS" ]; then
    log_info "Cleaning up chaincode containers..."
    log_info "$CONTAINER_IDS" | xargs -r docker stop &> /dev/null || true

    log_warn "Removing containers..."
    echo "$CONTAINER_IDS" | xargs -r docker rm -f &> /dev/null || true

    log_success "Chaincode containers cleaned."
fi
