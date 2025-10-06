#!/bin/bash

# Usage: ./run.sh <codemod-path> <file-pattern> [jscodeshift options...]
# Example: ./run.sh nb/box "src/**/*.tsx"
# Example: ./run.sh transforms/split-atoms "src/**/*.tsx"

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <transform> <files> [jscodeshift-options]"
  echo ""
  echo "Transforms: ls src/nb/*.js | xargs -n1 basename"
  echo "Example: $0 nb/button \"src/**/*.tsx\" --apply"
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
