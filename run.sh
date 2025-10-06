#!/bin/bash

# Run jscodeshift transforms with automatic formatting
#
# Usage: ./run.sh <transform> --target=<path> [options]
#
# Can be run from any directory. Target path should be absolute or relative
# to your current working directory. Defaults to *.ts,*.tsx and ignores node_modules.
#
# Transforms:
#   nb/box, nb/button, nb/stack, nb/pressable, nb/switch,
#   nb/avatar, nb/alert, nb/badge, nb/icon, nb/input,
#   nb/typography, nb/split-atoms
#   redirect-imports, remove-unused
#
# Options:
#   --target=<path>        Target directory or files (required)
#   --tokenImport=<path>   Design tokens import (required for nb/ transforms)
#   --targetImport=<path>  Target component import
#   --sourceImport=<path>  Source import to migrate from
#   --debug                Show prop categorization and token conversions
#   --dry                  Dry run (don't write files)
#
# Examples:
#
#   From the codemods directory:
#     ./run.sh nb/box --target=../my-app/src/ --tokenImport="@org/tokens"
#
#   From a monorepo root:
#     ./codemods/run.sh nb/box --target=packages/app/src --tokenImport="@org/tokens"
#
#   Dry run first (recommended):
#     ./run.sh nb/box --target=src/ --tokenImport="@org/tokens" --dry
#
#   General transforms:
#     ./run.sh redirect-imports --target=src/ --sourceImport="native-base" --targetImport="@org/ui"
#     ./run.sh remove-unused --target=src/

set -e

# Resolve script directory for portable paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <transform> --target=<path> [options]"
  echo ""
  echo "Run '$0 --help' or see script header for available transforms and options"
  exit 1
fi

CODEMOD_PATH=$1
shift 1

# Parse --target flag from arguments
TARGET=""
REMAINING_ARGS=()
for arg in "$@"; do
  if [[ "$arg" == --target=* ]]; then
    TARGET="${arg#--target=}"
  else
    REMAINING_ARGS+=("$arg")
  fi
done
set -- "${REMAINING_ARGS[@]}"

if [ -z "$TARGET" ]; then
  echo "Error: --target=<path> is required"
  echo "Example: $0 nb/box --target=src/"
  exit 1
fi

# Build transform path relative to script location
TRANSFORM_PATH="$SCRIPT_DIR/src/${CODEMOD_PATH}.js"

if [ ! -f "$TRANSFORM_PATH" ]; then
  echo "Error: Codemod not found at ${TRANSFORM_PATH}"
  exit 1
fi

# Use jscodeshift from script's node_modules
JSCODESHIFT="$SCRIPT_DIR/node_modules/.bin/jscodeshift"

if [ ! -f "$JSCODESHIFT" ]; then
  echo "Error: jscodeshift not found. Run: npm install in $SCRIPT_DIR"
  exit 1
fi

# Default options: TypeScript files, ignore node_modules
DEFAULT_OPTS="--extensions=ts,tsx --ignore-pattern=**/node_modules/** --parser=tsx"

echo "Running: $JSCODESHIFT -t $TRANSFORM_PATH $TARGET $DEFAULT_OPTS $@"
echo ""

# Run jscodeshift with defaults
"$JSCODESHIFT" -t "$TRANSFORM_PATH" "$TARGET" $DEFAULT_OPTS "$@"

echo ""
echo "Formatting with Biome..."
npm run lint:fix -- --files-ignore-unknown=true "$TARGET" 2>/dev/null || true

echo "Done!"
