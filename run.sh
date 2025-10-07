#!/bin/bash

# Usage: ./run.sh <codemod-name> <file-pattern> [jscodeshift options...]
# Example: ./run.sh nb-redirect "src/**/*.js"
# Example with options: ./run.sh hstack-to-stack "src/**/*.js" --sourceName=VStack --propValue=column

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <codemod-name> <file-pattern> [jscodeshift-options...]"
  echo ""
  echo "Available codemods:"
  echo "  - nb-redirect"
  echo "  - shim-redirect"
  echo "  - split-atoms"
  echo "  - migrate-stack"
  echo "  - hstack-to-stack"
  echo "  - migrate-nb-component"
  echo ""
  echo "Example: $0 split-atoms \"src/**/*.{js,jsx,ts,tsx}\""
  echo "Example with options: $0 migrate-stack \"src/**/*.js\" --sourceName=VStack"
  echo ""
  echo "All arguments after <file-pattern> are passed directly to jscodeshift."
  exit 1
fi

CODEMOD_NAME=$1
FILE_PATTERN=$2
shift 2  # Remove first two arguments, all remaining args go to jscodeshift
TRANSFORM_PATH="src/${CODEMOD_NAME}.js"

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
