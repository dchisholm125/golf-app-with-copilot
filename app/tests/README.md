# Playwright Testing Suite

This directory contains the comprehensive UI testing suite for the Golf App using Playwright.

## Overview

The testing suite is designed to test the entire user experience of the golf application, including:
- Navigation and basic app functionality
- Authentication and user management
- Wolf game functionality
- Skins game functionality
- Component-level testing
- Responsive design testing
- Error handling and edge cases

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── navigation.spec.ts  # Navigation and basic functionality
│   ├── authentication.spec.ts # Auth and user management
│   ├── wolf-game.spec.ts   # Wolf game functionality
│   └── skins-game.spec.ts  # Skins game functionality
├── components/             # Component-level tests
│   └── NavBar.spec.ts      # NavBar component tests
├── utils/                  # Test utilities and helpers
│   └── test-helpers.ts     # Common test functions
├── global-setup.ts         # Global test setup
├── global-teardown.ts      # Global test cleanup
└── README.md              # This file
```

## Getting Started

### Prerequisites

1. Install Playwright and browsers:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

2. Install system dependencies (Linux):
```bash
sudo npx playwright install-deps
```

### Running Tests

#### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

#### Running Specific Tests

```bash
# Run only navigation tests
npx playwright test navigation.spec.ts

# Run only Wolf game tests
npx playwright test wolf-game.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should create"

# Run tests in specific browser
npx playwright test --project=chromium
```

#### Running Tests in Different Environments

```bash
# Run tests against production
npx playwright test --baseURL=https://your-app.com

# Run tests with specific configuration
npx playwright test --config=playwright.config.ts
```

## Test Configuration

The main configuration is in `playwright.config.ts` at the root of the project. Key features:

- **Multi-browser testing**: Chrome, Firefox, Safari, and mobile browsers
- **Parallel execution**: Tests run in parallel for faster execution
- **Automatic retries**: Failed tests are retried on CI
- **Screenshots and videos**: Captured on test failures
- **Global setup**: Handles authentication setup
- **Web server**: Automatically starts the dev server for testing

## Test Helpers

The `TestHelpers` class in `utils/test-helpers.ts` provides common functions for:

- Navigation between pages
- Game creation and setup
- Score submission
- Authentication checks
- Screenshot capture
- API mocking

### Example Usage

```typescript
import { TestHelpers, createTestPlayers } from '../utils/test-helpers'

test('should create a Wolf game', async ({ page }) => {
  const helpers = new TestHelpers(page)
  const players = createTestPlayers(4)
  
  await helpers.createGame({
    gameType: 'wolf',
    players
  })
  
  await helpers.startWolfGame()
  // ... test assertions
})
```

## Authentication Testing

The test suite includes comprehensive authentication testing:

- Login/logout flows
- Protected route access
- Authentication state persistence
- Error handling for auth failures

### Setting Up Test Authentication

1. Configure Auth0 test credentials in `tests/global-setup.ts`
2. Set environment variables for test users:
   ```bash
   export TEST_USER_EMAIL=test@example.com
   export TEST_USER_PASSWORD=testpassword
   ```

## Game Testing

### Wolf Game Tests

Tests cover the complete Wolf game flow:
- Game creation with 4 players
- Partner selection
- Lone Wolf option
- Hole completion
- Score tracking
- Game completion

### Skins Game Tests

Tests cover the complete Skins game flow:
- Game creation with skin value
- Score entry for all players
- Skin calculation and carryover
- Player totals
- Game completion

## Component Testing

Component tests focus on individual Vue components:
- Props and event handling
- User interactions
- Responsive behavior
- Accessibility features

## Best Practices

### Writing Tests

1. **Use descriptive test names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use test helpers**: Leverage the `TestHelpers` class for common operations
4. **Test user flows**: Focus on complete user journeys rather than isolated features
5. **Handle async operations**: Always wait for elements to be visible/ready

### Example Test Structure

```typescript
test('should complete a full Wolf game', async ({ page }) => {
  // Arrange
  const helpers = new TestHelpers(page)
  const players = createTestPlayers(4)
  
  // Act
  await helpers.createGame({ gameType: 'wolf', players })
  await helpers.startWolfGame()
  
  // Complete game logic...
  
  // Assert
  await expect(page.locator('h1:has-text("Game Complete")')).toBeVisible()
})
```

### Selectors

Use reliable selectors:
- **Text selectors**: `page.locator('button:has-text("Start Game")')`
- **Data attributes**: `page.locator('[data-testid="user-avatar"]')`
- **Semantic selectors**: `page.locator('h1:has-text("Welcome")')`

Avoid:
- CSS classes that might change
- Complex CSS selectors
- XPath selectors

## Debugging Tests

### Debug Mode

```bash
npm run test:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- Inspect elements
- View network requests
- Take screenshots

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots at the moment of failure
- Video recordings of the entire test
- Trace files for detailed debugging

### Common Debugging Commands

```typescript
// Pause execution
await page.pause()

// Take a screenshot
await page.screenshot({ path: 'debug.png' })

// Log page content
console.log(await page.content())

// Check element state
console.log(await page.locator('button').isVisible())
```

## CI/CD Integration

### GitHub Actions

The test suite can be integrated into CI/CD pipelines:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test

- name: Upload test results
  uses: actions/upload-artifact@v2
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### Environment Variables

Set these in your CI environment:
- `CI=true`: Enables CI-specific settings
- `TEST_USER_EMAIL`: Test user email
- `TEST_USER_PASSWORD`: Test user password

## Performance Testing

The test suite includes performance considerations:

- Tests run in parallel for faster execution
- Browser reuse for efficiency
- Minimal setup/teardown overhead
- Optimized selectors for speed

## Troubleshooting

### Common Issues

1. **Browser not found**: Run `npx playwright install`
2. **System dependencies missing**: Run `sudo npx playwright install-deps`
3. **Tests timing out**: Increase timeout in config or add explicit waits
4. **Authentication issues**: Check Auth0 configuration and test credentials

### Getting Help

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing.html)

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the `TestHelpers` class for common operations
3. Add appropriate assertions
4. Include both positive and negative test cases
5. Test responsive behavior
6. Add error handling tests

## Maintenance

Regular maintenance tasks:

1. Update Playwright version: `npm update @playwright/test`
2. Update browsers: `npx playwright install`
3. Review and update test selectors as the app evolves
4. Monitor test performance and optimize slow tests
5. Update test data and mock responses as needed

# Testing Guide

This guide covers how to set up and run tests for the Golf App, including Auth0 authentication and Wolf game functionality.

## 🚀 Quick Start

### 1. Setup Test Environment

```bash
# Run the setup script
npm run test:setup

# This will create .env.test file and guide you through setup
```

### 2. Configure Auth0 Test User

1. Go to your Auth0 Dashboard
2. Navigate to **User Management** > **Users**
3. Create a new test user:
   - Email: `test@golfapp.com` (or your preferred test email)
   - Password: `TestPassword123!` (or a secure test password)
   - Email Verified: ✅ Check this
4. Update `.env.test` with your test user credentials

### 3. Run Tests

```bash
# Run all authenticated tests (Wolf game, etc.)
npm run test:auth

# Run all unauthenticated tests (Auth0 login flow)
npm run test:unauth

# Run specific test suites
npm run test:wolf      # Wolf game tests
npm run test:auth0     # Auth0 authentication tests

# Run with UI for debugging
npm run test:ui
```

## 📋 Test Categories

### Authenticated Tests
These tests require a logged-in user and test the main application functionality:

- **Wolf Game Complete Flow** (`wolf-game-complete-flow.spec.ts`)
  - Full 9-hole and 18-hole Wolf games
  - Scoreboard math verification
  - Game state management
  - Mobile responsiveness

- **Wolf Game Basic** (`wolf-game-basic.spec.ts`)
  - Basic game creation and hole completion
  - Simple game flow validation

### Unauthenticated Tests
These tests verify the authentication flow:

- **Auth0 Authentication** (`auth0-authentication.spec.ts`)
  - Login form validation
  - Error handling
  - Password visibility toggle
  - Forgot password flow
  - Sign up flow

## 🔧 Test Configuration

### Environment Variables

Create a `.env.test` file with:

```bash
# Auth0 Test Credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-audience
```

### Playwright Projects

- **`authenticated`**: Uses stored auth state for logged-in user tests
- **`unauthenticated`**: Fresh browser session for auth flow tests

## 🧪 Running Specific Tests

```bash
# Run a specific test file
npm test -- tests/e2e/wolf-game-complete-flow.spec.ts --project=authenticated

# Run a specific test by name
npm test -- -g "should complete a full 9-hole Wolf game" --project=authenticated

# Run tests in headed mode (see browser)
npm test -- --headed --project=authenticated

# Run tests in debug mode
npm test -- --debug --project=authenticated
```

## 🔍 Debugging Tests

### Authentication Issues

If authentication fails:

1. Check `.env.test` credentials
2. Verify test user exists in Auth0
3. Check `auth-setup-error.png` screenshot
4. Review `auth-setup-error.log` for details

### Test Failures

1. **Screenshots**: Automatically saved on failure
2. **Videos**: Recorded for failed tests
3. **Traces**: Available with `--trace on`

### Common Issues

- **Auth0 redirect issues**: Check Auth0 configuration
- **Element not found**: Check selectors match actual page structure
- **Timeout errors**: Increase timeout or check network connectivity

## 📊 Test Reports

```bash
# View HTML report
npm run test:report

# Generate report after running tests
npm test -- --reporter=html
```

## 🚀 CI/CD Integration

For continuous integration:

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run tests in CI mode
npm test -- --project=authenticated --reporter=html
```

## 🔒 Security Notes

- Never commit real credentials to version control
- Use dedicated test user accounts
- Regularly rotate test passwords
- Consider using Auth0's test mode for development

## 📝 Adding New Tests

### For Authenticated Features

```typescript
import { test, expect } from '@playwright/test'

test.describe('New Feature', () => {
  test.use({ storageState: 'tests/auth-state.json' })
  
  test('should test new feature', async ({ page }) => {
    // Your test code here
  })
})
```

### For Authentication Features

```typescript
import { test, expect } from '@playwright/test'

test.describe('New Auth Feature', () => {
  test('should test auth feature', async ({ page }) => {
    // Your test code here
  })
})
```

## 🆘 Troubleshooting

### Auth0 Setup Issues

1. **Domain mismatch**: Ensure Auth0 domain matches your app config
2. **Client ID issues**: Verify client ID in Auth0 dashboard
3. **Callback URL**: Check Auth0 application settings

### Test Environment Issues

1. **Port conflicts**: Ensure ports 5173 (frontend) and 8000 (backend) are available
2. **Database issues**: Check backend database connection
3. **Network issues**: Verify localhost accessibility

### Browser Issues

1. **WebKit dependencies**: Install with `sudo npx playwright install-deps`
2. **Chrome issues**: Update Chrome or use system Chrome
3. **Firefox issues**: Check Firefox installation

## 📞 Support

For test-related issues:

1. Check this README
2. Review Auth0 setup guide (`tests/auth0-setup.md`)
3. Check test logs and screenshots
4. Verify environment configuration 