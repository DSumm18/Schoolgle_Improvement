#!/usr/bin/env bash
# Theme consistency check
#
# Scans src/**/*.{tsx,jsx} for hardcoded Tailwind light/dark colours that
# would break when the user switches between light and dark mode. Semantic
# tokens (bg-card, bg-background, text-foreground, etc) are required for
# any colour that isn't explicitly scoped with `dark:`.
#
# Usage:
#   bash scripts/check-theme-consistency.sh                    # full scan, report only
#   bash scripts/check-theme-consistency.sh --fail-on-found    # exit 1 if any found
#   bash scripts/check-theme-consistency.sh --changed          # scan only staged files
#
# Exit codes:
#   0 = clean (or --fail-on-found not set)
#   1 = violations found with --fail-on-found

set -e

SRC_DIR="${SRC_DIR:-src}"
FAIL_ON_FOUND=false
CHANGED_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --fail-on-found) FAIL_ON_FOUND=true ;;
    --changed) CHANGED_ONLY=true ;;
  esac
done

# Patterns that indicate hardcoded theme colours without a `dark:` prefix
# These break one of light/dark mode.
FORBIDDEN_PATTERNS=(
  'bg-(gray|slate|zinc|neutral|stone)-(800|900|950)'
  'text-(gray|slate|zinc|neutral|stone)-(50|100|200)'
  'border-(gray|slate|zinc|neutral|stone)-(700|800|900)'
  'bg-white(?![a-z-])'
  'bg-black(?![a-z-])'
  'text-white(?![a-z-])'
  'text-black(?![a-z-])'
)

if $CHANGED_ONLY; then
  # Only check staged files
  FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "^apps/platform/src/.*\.(tsx|jsx)$" || true)
else
  FILES=$(find "$SRC_DIR" -type f \( -name '*.tsx' -o -name '*.jsx' \) 2>/dev/null || true)
fi

if [ -z "$FILES" ]; then
  echo "✓ No files to check"
  exit 0
fi

TOTAL_VIOLATIONS=0
VIOLATION_REPORT=""

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  for file in $FILES; do
    [ -f "$file" ] || continue

    # Find lines matching the forbidden pattern
    # Exclude lines where the colour is prefixed with `dark:` (explicit dark-mode scope is OK)
    matches=$(grep -nE "className.*\b$pattern\b" "$file" 2>/dev/null || true)

    if [ -n "$matches" ]; then
      # Filter out lines where the full class has dark: prefix
      filtered=$(echo "$matches" | grep -vE "dark:(bg|text|border)-(gray|slate|zinc|neutral|stone)" || true)
      filtered=$(echo "$filtered" | grep -vE "dark:(bg|text)-(white|black)" || true)

      # Also filter lines where the token IS the dark override
      # e.g. `bg-white dark:bg-gray-900` should be allowed (both sides explicit)
      # but `bg-gray-900` alone should not.

      if [ -n "$filtered" ]; then
        while IFS= read -r line; do
          # Extract class attribute content
          if echo "$line" | grep -qE "className.*\b$pattern\b"; then
            # If this class has a paired dark: variant, it's OK
            line_content=$(echo "$line" | sed -E 's/.*className[^"]*"([^"]*)".*/\1/')
            if echo "$line_content" | grep -qE "dark:"; then
              # Has some dark: variant — more lenient
              continue
            fi
            TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + 1))
            VIOLATION_REPORT+="$file: $line\n"
          fi
        done <<< "$filtered"
      fi
    fi
  done
done

if [ $TOTAL_VIOLATIONS -eq 0 ]; then
  echo "✓ Theme consistency check passed — no hardcoded colours without dark: override found"
  exit 0
fi

echo "⚠️  Theme consistency violations found ($TOTAL_VIOLATIONS):"
echo ""
echo -e "$VIOLATION_REPORT" | head -50
echo ""
echo "Use semantic tokens instead:"
echo "  bg-card            (card backgrounds)"
echo "  bg-background      (page backgrounds)"
echo "  bg-muted           (subtle backgrounds)"
echo "  text-foreground    (primary text)"
echo "  text-muted-foreground  (secondary text)"
echo "  border-border      (borders)"
echo "  bg-primary / text-primary-foreground  (accents)"
echo ""
echo "Or pair hardcoded colours with a dark: variant:"
echo "  bg-white dark:bg-gray-900"
echo "  text-gray-900 dark:text-white"

if $FAIL_ON_FOUND; then
  exit 1
fi
exit 0
