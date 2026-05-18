# Shared helpers for local EAS builds. Source from build-local-*.sh (do not execute directly).

# Matches eas.json → cli.version (avoids stale global eas-cli@16.x)
EAS_CLI=(npx --yes "eas-cli@>=18.12.3")

load_build_env() {
  local profile="${1:-preview}"
  export EXPO_NO_DOTENV=1

  local env_file
  if [ "$profile" = "production" ]; then
    env_file=".env.production"
  else
    env_file=".env.local"
  fi

  if [ -f "$env_file" ]; then
    echo -e "${BLUE}Loading ${env_file} (profile: ${profile})${NC}"
    set -a
    # shellcheck source=/dev/null
    . "./${env_file}"
    set +a
    echo -e "${GREEN}Env loaded from ${env_file}${NC}"
    return 0
  fi

  if [ "$profile" != "production" ] && [ -f .env ]; then
    echo -e "${YELLOW}${env_file} missing; falling back to .env${NC}"
    set -a
    # shellcheck source=/dev/null
    . ./.env
    set +a
    return 0
  fi

  echo -e "${YELLOW}Warning: ${env_file} not found. Set EAS Secrets or create the file.${NC}"
}

apply_android_speed_opts() {
  export GRADLE_OPTS="${GRADLE_OPTS:-} -Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.caching=true -Dorg.gradle.configureondemand=true"
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
}

apply_ios_speed_opts() {
  export EXPO_NO_CAPABILITY_SYNC=1
}

run_eas_local_build() {
  local platform="$1"
  local profile="$2"
  shift 2

  echo -e "${BLUE}EAS: $("${EAS_CLI[@]}" --version 2>/dev/null | head -n 1)${NC}"
  echo -e "${BLUE}Command: ${EAS_CLI[*]} build -p ${platform} --profile ${profile} --local --non-interactive${NC}"
  echo ""

  if [ "$#" -gt 0 ]; then
    "${EAS_CLI[@]}" build \
      -p "$platform" \
      --profile "$profile" \
      --local \
      --non-interactive \
      "$@"
  else
    "${EAS_CLI[@]}" build \
      -p "$platform" \
      --profile "$profile" \
      --local \
      --non-interactive
  fi
}
