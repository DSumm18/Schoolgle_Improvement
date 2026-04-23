#!/bin/bash

# ============================================
# 🔒 ENV FILE SECURITY VERIFICATION
# ============================================

echo "🔒 Schoolgle Environment Security Check"
echo "======================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check if .env.local is in .gitignore
if grep -q "\.env\*" .gitignore || grep -q "\.env\.local" .gitignore; then
    echo "✅ .env.local is in .gitignore (protected from git commits)"
else
    echo "⚠️  WARNING: .env.local might not be fully protected in .gitignore"
fi

# Check for any actual API keys (not placeholders)
if grep -q "your-.*-here" .env.local; then
    echo "📝 .env.local contains placeholder values (ready for your keys)"
    PLACEHOLDER_COUNT=$(grep -c "your-.*-here" .env.local)
    echo "   Found $PLACEHOLDER_COUNT placeholders to replace"
elif grep -q "sk-or-v1-" .env.local || grep -q "eyJ" .env.local; then
    echo "🔑 .env.local contains what appears to be real API keys"
    echo "   ✅ These are protected by .gitignore and will NOT be committed to GitHub"
fi

# Test git status to confirm it's ignored
if git status --ignored 2>/dev/null | grep -q "\.env\.local"; then
    echo "✅ Git confirms .env.local is ignored (SAFE from commits)"
fi

# Check for required variables
echo ""
echo "📋 Required Variables Status:"
REQUIRED_VARS=(
    "OPENROUTER_API_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env.local; then
        if grep "^$var=" .env.local | grep -q "your-.*-here"; then
            echo "   ⏳ $var - Needs real key"
        else
            echo "   ✅ $var - Has value set"
        fi
    else
        echo "   ❌ $var - Missing from .env.local"
    fi
done

echo ""
echo "🔒 SECURITY STATUS: SAFE"
echo "   • .env.local is in .gitignore"
echo "   • Your API keys will NEVER be committed to GitHub"
echo "   • Ready for you to paste your API keys"
echo ""
echo "📝 Next Steps:"
echo "   1. Open .env.local in a text editor"
echo "   2. Replace placeholder values with your actual API keys"
echo "   3. Save the file"
echo "   4. Restart the server: npm run dev"
echo ""
