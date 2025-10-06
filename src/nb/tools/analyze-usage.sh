#!/usr/bin/env zsh

# NativeBase Usage Analysis
# Uses import-tracing analyzer for accurate counts

set +e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANALYZER="$SCRIPT_DIR/nb-analyzer.cjs"
TARGET_DIR="${TARGET_DIR:-$(pwd)}"
# Make TARGET_DIR absolute
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

# Parse arguments
CURRENT_ONLY=false
CSV_DIR=""
DAYS_BACK=30
INTERNAL_PREFIX=""
DESIGN_SYSTEM=""
PACKAGES_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --current|-c)
            CURRENT_ONLY=true
            shift
            ;;
        --csv)
            CSV_DIR="$2"
            shift 2
            ;;
        --days|-d)
            DAYS_BACK="$2"
            shift 2
            ;;
        --internal-prefix)
            INTERNAL_PREFIX="$2"
            shift 2
            ;;
        --design-system)
            DESIGN_SYSTEM="$2"
            shift 2
            ;;
        --packages-dir)
            PACKAGES_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: analyze-usage.sh [options]"
            echo ""
            echo "Options:"
            echo "  -c, --current           Analyze current commit only"
            echo "  -d, --days <n>          Number of days to analyze (default: 30)"
            echo "  --csv <dir>             Export to CSV files in directory"
            echo "  -h, --help              Show help"
            echo ""
            echo "Config:"
            echo "  --internal-prefix <pkg> Internal package prefix (default: @internal)"
            echo "  --design-system <name>  Design system name (default: design-system)"
            echo "  --packages-dir <dir>    Packages directory (default: packages)"
            echo ""
            echo "Environment:"
            echo "  TARGET_DIR              Repository to analyze (default: current directory)"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Build analyzer options
ANALYZER_OPTS=""
[[ -n "$INTERNAL_PREFIX" ]] && ANALYZER_OPTS="$ANALYZER_OPTS --internal-prefix $INTERNAL_PREFIX"
[[ -n "$DESIGN_SYSTEM" ]] && ANALYZER_OPTS="$ANALYZER_OPTS --design-system $DESIGN_SYSTEM"
[[ -n "$PACKAGES_DIR" ]] && ANALYZER_OPTS="$ANALYZER_OPTS --packages-dir $PACKAGES_DIR"

if [[ ! -f "$ANALYZER" ]]; then
    echo "Error: $ANALYZER not found"
    exit 1
fi

# Current state analysis
if [[ "$CURRENT_ONLY" == "true" ]]; then
    # Get commit info from TARGET_DIR, not codemods repo
    CURRENT_COMMIT=$(git -C "$TARGET_DIR" rev-parse HEAD)
    CURRENT_DATE=$(git -C "$TARGET_DIR" show -s --format=%ci HEAD | cut -d' ' -f1)

    echo "Analyzing current commit: ${CURRENT_COMMIT:0:8}"
    echo "Date: $CURRENT_DATE"
    echo "Target: $TARGET_DIR"
    echo ""

    if [[ -n "$CSV_DIR" ]]; then
        node "$ANALYZER" "$TARGET_DIR" --csv "$CSV_DIR" $ANALYZER_OPTS
    else
        node "$ANALYZER" "$TARGET_DIR" $ANALYZER_OPTS
    fi
    exit 0
fi

# Historical analysis
echo "Analyzing last $DAYS_BACK days of commits..."

# Make CSV_DIR absolute before we cd to target repo
if [[ -n "$CSV_DIR" ]]; then
    mkdir -p "$CSV_DIR"
    CSV_DIR="$(cd "$CSV_DIR" && pwd)"
    echo "Output: $CSV_DIR/"
    # Clear existing files for fresh historical run
    rm -f "$CSV_DIR/nb-summary.csv" "$CSV_DIR/nb-components.csv" "$CSV_DIR/nb-packages.csv" "$CSV_DIR/nb-files.csv"
fi
echo ""

END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -v-${DAYS_BACK}d +%Y-%m-%d)

echo "Range: $START_DATE to $END_DATE"
echo "Target: $TARGET_DIR"
echo ""

# All git operations must happen in TARGET_DIR, not codemods repo
cd "$TARGET_DIR" || exit 1

if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "Stashing changes..."
    git stash push -m "analyze-usage temporary stash"
    STASHED=true
fi

typeset -A analyzed_commits
typeset -A processed_dates

analyze_commit() {
    local commit_sha="$1"
    local commit_date="$2"

    echo -n "Analyzing $commit_date (${commit_sha:0:8})... "

    if [[ -n "${analyzed_commits[$commit_sha]}" ]]; then
        echo "cached"
        return
    fi

    if ! git checkout --quiet "$commit_sha" 2>&1; then
        echo "checkout failed"
        return
    fi

    if [[ -n "$CSV_DIR" ]]; then
        if ! node "$ANALYZER" "$TARGET_DIR" --csv "$CSV_DIR" --append $ANALYZER_OPTS 2>&1; then
            echo "analyzer error"
            return
        fi
    else
        output=$(node "$ANALYZER" "$TARGET_DIR" --machine $ANALYZER_OPTS 2>&1)
        if [[ $? -ne 0 ]]; then
            echo "analyzer error: $output"
            return
        fi
    fi

    analyzed_commits[$commit_sha]=1
    echo "done"
}

day_count=0
current_date="$START_DATE"
max_iterations=366
iteration=0

while [[ "$current_date" < "$END_DATE" ]] || [[ "$current_date" == "$END_DATE" ]]; do
    ((iteration++))
    [[ $iteration -gt $max_iterations ]] && break

    commit_sha=$(git rev-list -n 1 --before="$current_date 23:59:59" --after="$current_date 00:00:00" main 2>/dev/null | head -1)

    if [[ -z "$commit_sha" ]]; then
        three_days_ago=$(date -j -v-3d -f "%Y-%m-%d" "$current_date" +%Y-%m-%d 2>/dev/null)
        commit_sha=$(git rev-list -n 1 --before="$current_date 23:59:59" --after="$three_days_ago 00:00:00" main 2>/dev/null | head -1)
    fi

    [[ -z "$commit_sha" ]] && commit_sha=$(git rev-list -n 1 --before="$current_date 23:59:59" main 2>/dev/null | head -1)

    if [[ -n "$commit_sha" ]] && [[ -z "${processed_dates[$current_date]}" ]]; then
        analyze_commit "$commit_sha" "$current_date"
        processed_dates[$current_date]=1
        ((day_count++))
    fi

    current_date=$(date -j -v+1d -f "%Y-%m-%d" "$current_date" +%Y-%m-%d 2>/dev/null || break)
done

echo ""
echo "Returning to main..."
git checkout --quiet main

[[ "$STASHED" == "true" ]] && git stash pop --quiet

echo ""
echo "Done! $day_count days analyzed"

if [[ -n "$CSV_DIR" ]] && ls "$CSV_DIR"/*.csv >/dev/null 2>&1; then
    echo ""
    echo "CSV files:"
    ls -la "$CSV_DIR"/*.csv
    echo ""
    echo "Summary preview:"
    head -5 "$CSV_DIR/nb-summary.csv" | column -t -s ','
fi
