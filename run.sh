#!/bin/bash

# Usage: ./run.sh <codemod-name> <file-pattern> [jscodeshift options...]
# Example: ./run.sh nb-redirect "src/**/*.js"
# Example with options: ./run.sh hstack-to-stack "src/**/*.js" --sourceName=VStack --propValue=column

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <codemod-name> <file-pattern> [jscodeshift-options...]"
  echo ""
  echo "Available migrations:"
  echo "  - migrate-avatar      Migrate NativeBase Avatar → Nordlys Avatar"
  echo "  - migrate-box         Migrate NativeBase Box → React Native View"
  echo "  - migrate-button      Migrate NativeBase Button → Nordlys Button"
  echo "  - migrate-pressable   Migrate NativeBase Pressable → React Native Pressable"
  echo "  - migrate-stack       Migrate NativeBase HStack/VStack → Nordlys Stack"
  echo "  - migrate-switch      Migrate NativeBase Switch → Nordlys Switch"
  echo "  - migrate-typography  Migrate NativeBase Typography → Nordlys Typography"
  echo ""
  echo "Available transforms:"
  echo "  - nb-redirect         Redirect native-base imports"
  echo "  - shim-redirect       Redirect shim imports"
  echo "  - split-atoms         Split barrel imports into individual imports"
  echo ""
  echo "Examples:"
  echo "  $0 migrate-box \"src/**/*.{js,jsx,ts,tsx}\""
  echo "  $0 migrate-stack \"src/**/*.js\" --sourceName=VStack"
  echo "  $0 split-atoms \"src/components/**/*.tsx\""
  echo ""
  echo "All arguments after <file-pattern> are passed directly to jscodeshift."
  exit 1
fi

CODEMOD_NAME=$1
FILE_PATTERN=$2
shift 2  # Remove first two arguments, all remaining args go to jscodeshift

# Map codemod names to file paths
# Migrations: migrate-* → src/migrations/*.js
# Transforms: everything else → src/transforms/*.js
case "$CODEMOD_NAME" in
  migrate-avatar)
    TRANSFORM_PATH="src/migrations/avatar.js"
    ;;
  migrate-box)
    TRANSFORM_PATH="src/migrations/box.js"
    ;;
  migrate-button)
    TRANSFORM_PATH="src/migrations/button.js"
    ;;
  migrate-pressable)
    TRANSFORM_PATH="src/migrations/pressable.js"
    ;;
  migrate-stack)
    TRANSFORM_PATH="src/migrations/stack.js"
    ;;
  migrate-switch)
    TRANSFORM_PATH="src/migrations/switch.js"
    ;;
  migrate-typography)
    TRANSFORM_PATH="src/migrations/typography.js"
    ;;
  nb-redirect|shim-redirect)
    TRANSFORM_PATH="src/transforms/redirect-imports.js"
    ;;
  split-atoms)
    TRANSFORM_PATH="src/transforms/split-atoms.js"
    ;;
  *)
    # Fallback: try old structure for backwards compatibility
    TRANSFORM_PATH="src/${CODEMOD_NAME}.js"
    ;;
esac

if [ ! -f "$TRANSFORM_PATH" ]; then
  echo "Error: Codemod '${CODEMOD_NAME}' not found at ${TRANSFORM_PATH}"
  exit 1
fi

# Use locally installed jscodeshift
JSCODESHIFT="./node_modules/.bin/jscodeshift"

if [ ! -f "$JSCODESHIFT" ]; then
  echo "Error: jscodeshift not found at ${JSCODESHIFT}"
  echo "Run: npm install"
  exit 1
fi

echo "Running: $JSCODESHIFT -t $TRANSFORM_PATH $FILE_PATTERN $@"
echo ""

# Run jscodeshift with all remaining arguments passed through
# For TypeScript files, add --parser=tsx if not already specified
if [[ "$FILE_PATTERN" == *.tsx ]] && [[ ! "$@" =~ --parser ]]; then
  "$JSCODESHIFT" -t "$TRANSFORM_PATH" "$FILE_PATTERN" --parser=tsx "$@"
else
  "$JSCODESHIFT" -t "$TRANSFORM_PATH" "$FILE_PATTERN" "$@"
fi

echo ""
echo "Done! Remember to format the files with your project's formatter."
