#!/bin/bash

# Usage: ./run.sh <codemod-path> <file-pattern> [jscodeshift options...]
# Example: ./run.sh nb/box "src/**/*.tsx"
# Example: ./run.sh transforms/split-atoms "src/**/*.tsx"

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <codemod-path> <file-pattern> [jscodeshift-options...]"
  echo ""
  echo "Available codemods:"
  echo "  nb/avatar        - Avatar → Nordlys Avatar"
  echo "  nb/box           - Box → View with StyleSheet"
  echo "  nb/button        - Button → Nordlys Button"
  echo "  nb/pressable     - Pressable → React Native Pressable"
  echo "  nb/stack         - HStack/VStack → Aurora Stack"
  echo "  nb/switch        - Switch → Nordlys Switch"
  echo "  nb/typography    - Typography → Nordlys Typography"
  echo ""
  echo "  transforms/redirect-imports  - Redirect import paths"
  echo "  transforms/split-atoms       - Split barrel imports"
  echo ""
  echo "Examples:"
  echo "  $0 nb/box \"src/**/*.tsx\""
  echo "  $0 transforms/split-atoms \"src/**/*.tsx\""
  exit 1
fi

CODEMOD_PATH=$1
FILE_PATTERN=$2
shift 2  # Remove first two arguments, remaining go to jscodeshift

# Build transform path
TRANSFORM_PATH="src/${CODEMOD_PATH}.js"

if [ ! -f "$TRANSFORM_PATH" ]; then
  echo "Error: Codemod not found at ${TRANSFORM_PATH}"
  exit 1
fi

# Use locally installed jscodeshift
JSCODESHIFT="./node_modules/.bin/jscodeshift"

if [ ! -f "$JSCODESHIFT" ]; then
  echo "Error: jscodeshift not found. Run: npm install"
  exit 1
fi

echo "Running: $JSCODESHIFT -t $TRANSFORM_PATH $FILE_PATTERN $@"
echo ""

# Run jscodeshift
# For TypeScript files, add --parser=tsx if not already specified
if [[ "$FILE_PATTERN" == *.tsx ]] && [[ ! "$@" =~ --parser ]]; then
  "$JSCODESHIFT" -t "$TRANSFORM_PATH" "$FILE_PATTERN" --parser=tsx "$@"
else
  "$JSCODESHIFT" -t "$TRANSFORM_PATH" "$FILE_PATTERN" "$@"
fi

echo ""
echo "Formatting with Biome..."
npm run lint:fix -- --files-ignore-unknown=true "$FILE_PATTERN" 2>/dev/null || true

echo "Done!"
