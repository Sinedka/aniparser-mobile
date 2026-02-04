#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [android|ios|all]"
  exit 1
}

platform="${1:-all}"

case "$platform" in
  android)
    npm run android
    ;;
  ios)
    npm run ios
    ;;
  all)
    npm run android
    npm run ios
    ;;
  *)
    usage
    ;;
esac
