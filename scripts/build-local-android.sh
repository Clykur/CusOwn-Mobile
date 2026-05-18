#!/usr/bin/env bash
#
# Fast local Android APK build via EAS (react-native-razorpay / native modules).
#
# Env: preview/development → .env.local | production → .env.production
#
# Usage:
#   ./scripts/build-local-android.sh
#   ./scripts/build-local-android.sh production
#   ./scripts/build-local-android.sh --fast
#   ./scripts/build-local-android.sh --check-only

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
      echo "Usage: ./scripts/build-local-android.sh [preview|production|development] [--full-checks] [--clean-cache] [--check-only]"
      exit 1
      ;;
  esac
done

quick_check_android() {
  [ -d "${ANDROID_HOME:-$HOME/Library/Android/sdk}" ] || {
    echo -e "${RED}Android SDK not found${NC}"
    return 1
  }
  command -v java &>/dev/null || {
    echo -e "${RED}Java not found (brew install openjdk@17)${NC}"
    return 1
  }
  return 0
}

full_check_android() {
  echo -e "${BLUE}Android prerequisites (full)${NC}"
  quick_check_android || return 1
  command -v adb &>/dev/null && echo -e "  adb: ${GREEN}ok${NC}" || echo -e "  adb: ${YELLOW}optional${NC}"
  grep -q '"react-native-razorpay"' package.json && echo -e "  razorpay: ${GREEN}ok${NC}" || echo -e "  razorpay: ${RED}missing${NC}"
  echo ""
}

setup_android_env() {
  if [ -d /opt/homebrew/opt/openjdk@17 ]; then
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17
    export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
  fi
  apply_android_speed_opts
  export PATH="$PATH:$ANDROID_HOME/platform-tools"
}

main() {
  echo -e "${GREEN}Android local APK build${NC}"
  echo -e "${BLUE}Profile: ${BUILD_PROFILE}${NC}"
  [ "$FAST_BUILD" = true ] && echo -e "${BLUE}Mode: fast (minimal checks, Gradle cache on)${NC}"
  [ "$CLEAR_CACHE" = true ] && echo -e "${YELLOW}Mode: clean cache (slower, use if build is broken)${NC}"
  echo ""

  load_build_env "$BUILD_PROFILE"
  echo ""

  if [ "$CHECK_ONLY" = true ]; then
    full_check_android
    exit $?
  fi

  if [ "$FAST_BUILD" = true ]; then
    quick_check_android || exit 1
  else
    full_check_android || echo -e "${YELLOW}Continuing; build may fail.${NC}"
  fi

  setup_android_env

  if [ "$CLEAR_CACHE" = true ]; then
    run_eas_local_build android "$BUILD_PROFILE" --clear-cache
  else
    run_eas_local_build android "$BUILD_PROFILE"
  fi

  echo ""
  echo -e "${GREEN}Done.${NC} Install: adb install -r build-*.apk"
}

main "$@"
