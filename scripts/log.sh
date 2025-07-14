#!/usr/bin/env bash

# ANSI codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

_log() {
    local color_code="$1"
    local message="$2"
    printf "${color_code} %s${NC}\n" "$message"
}

log_info() {
    _log "${BLUE}[*]" "$1"
}

log_success() {
    _log "${GREEN}[✓]" "$1"
}

log_warn() {
    _log "${YELLOW}[*]" "$1"
}

log_error() {
    _log "${RED}[!]" "$1"
}

log_misc() {
    _log "${PURPLE}[*]" "$1"
}

