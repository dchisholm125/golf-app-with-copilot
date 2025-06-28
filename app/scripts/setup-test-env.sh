#!/bin/bash

# Setup script for Auth0 test environment

echo "🚀 Setting up Auth0 test environment..."

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "📝 Creating .env.test file..."
    cat > .env.test << EOF
# Auth0 Test Credentials
# Replace these with your actual test user credentials
TEST_USER_EMAIL=test@golfapp.com
TEST_USER_PASSWORD=TestPassword123!

# Auth0 Configuration (should match your app config)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-audience
EOF
    echo "✅ Created .env.test file"
    echo "⚠️  Please update .env.test with your actual Auth0 test credentials"
else
    echo "✅ .env.test file already exists"
fi

# Check if test user credentials are set
if grep -q "test@golfapp.com" .env.test; then
    echo "⚠️  Please update TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test"
    echo "   with your actual Auth0 test user credentials"
fi

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
echo "1. Create a test user in your Auth0 dashboard"
echo "2. Update .env.test with the test user credentials"
echo "3. Run: npm test -- --project=authenticated"
echo "4. Or run specific tests: npm test -- tests/e2e/wolf-game-complete-flow.spec.ts --project=authenticated"
echo ""
echo "🔧 For Auth0 setup help, see: tests/auth0-setup.md" 