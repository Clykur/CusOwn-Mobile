#!/usr/bin/env bash
#
# Local iOS IPA build via EAS (react-native-razorpay / native modules).
#
# Env: preview/development → .env.local | production → .env.production
#
# Usage:
#   ./scripts/build-local-ios.sh
#   ./scripts/build-local-ios.sh production
#   ./scripts/build-local-ios.sh --fast
#   ./scripts/build-local-ios.sh --check-only

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=lib/build-common.sh
source "$ROOT_DIR/scripts/lib/build-common.sh"

BUILD_PROFILE="preview"
CHECK_ONLY=false
FAST_BUILD=true
CLEAR_CACHE=false

for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=true ;;
    --full-checks) FAST_BUILD=false ;;
    --fast) FAST_BUILD=true ;;
    --clean-cache) CLEAR_CACHE=true ;;
    preview|production|development) BUILD_PROFILE="$arg" ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      echo "Usage: ./scripts/build-local-ios.sh [preview|production|development] [--full-checks] [--clean-cache] [--check-only]"
      exit 1
      ;;
  esac
done

quick_check_ios() {
  command -v xcodebuild &>/dev/null || {
    echo -e "${RED}Xcode not found${NC}"
    return 1
  }
  xcode-select -p &>/dev/null || {
    echo -e "${RED}Run: xcode-select --install${NC}"
    return 1
  }
  return 0
}

full_check_ios() {
  echo -e "${BLUE}iOS prerequisites (full)${NC}"
  quick_check_ios || return 1
  command -v pod &>/dev/null && echo -e "  CocoaPods: ${GREEN}ok${NC}" || echo -e "  CocoaPods: ${YELLOW}optional (EAS may install)${NC}"
  grep -q '"react-native-razorpay"' package.json && echo -e "  razorpay: ${GREEN}ok${NC}" || echo -e "  razorpay: ${RED}missing${NC}"
  echo ""
}

main() {
  echo -e "${GREEN}iOS local IPA build${NC}"
  echo -e "${BLUE}Profile: ${BUILD_PROFILE}${NC}"
  [ "$FAST_BUILD" = true ] && echo -e "${BLUE}Mode: fast (minimal checks)${NC}"
  [ "$CLEAR_CACHE" = true ] && echo -e "${YELLOW}Mode: clean cache (slower)${NC}"
  echo ""

  load_build_env "$BUILD_PROFILE"
  echo ""

  apply_ios_speed_opts

  if [ "$CHECK_ONLY" = true ]; then
    full_check_ios
    exit $?
  fi

  if [ "$FAST_BUILD" = true ]; then
    quick_check_ios || exit 1
  else
    full_check_ios || echo -e "${YELLOW}Continuing; build may fail.${NC}"
  fi

  if [ "$CLEAR_CACHE" = true ]; then
    run_eas_local_build ios "$BUILD_PROFILE" --clear-cache
  else
    run_eas_local_build ios "$BUILD_PROFILE"
  fi

  echo ""
  echo -e "${GREEN}Done.${NC} Install IPA via Xcode or Apple Configurator."
}

main "$@"
