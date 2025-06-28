#!/bin/bash

# Script to set up authentication for Playwright tests

echo "🔐 Setting up authentication for Playwright tests..."

# Create auth state directory if it doesn't exist
mkdir -p tests

# Check if auth state file exists
if [ ! -f "tests/auth-state.json" ]; then
    echo "📝 Auth state file will be created when you run the first authenticated test"
else
    echo "✅ Auth state file exists"
fi

echo ""
echo "📋 Next steps:"
echo "1. Run the auth setup test to create auth-state.json:"
echo "   npx playwright test tests/auth/setup.spec.ts --project=unauthenticated --headed"
echo "2. Then run your Wolf game tests:"
echo "   npm run test:wolf-headed"
echo ""
echo "🔧 Using dummy login: dev@dev.dev / DEVdev1!" 