# Auth0 Test Setup Guide

## 1. Create Test User in Auth0 Dashboard

1. Go to your Auth0 Dashboard
2. Navigate to **User Management** > **Users**
3. Click **+ Create User**
4. Fill in the following details:
   - **Email**: `test@golfapp.com` (or your preferred test email)
   - **Password**: `TestPassword123!` (or a secure test password)
   - **Connection**: Select your database connection
   - **Email Verified**: ✅ Check this
5. Click **Create**

## 2. Set Environment Variables

Create a `.env.test` file in your project root:

```bash
# Auth0 Test Credentials
TEST_USER_EMAIL=test@golfapp.com
TEST_USER_PASSWORD=TestPassword123!

# Auth0 Configuration (should match your app config)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-audience
```

## 3. Update Playwright Config

Add the storage state configuration to your `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  projects: [
    {
      name: 'authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/auth-state.json'
      },
    },
    {
      name: 'unauthenticated',
      use: { 
        ...devices['Desktop Chrome']
      },
    },
  ],
})
```

## 4. Test User Permissions

Ensure your test user has the necessary permissions:
- Can access your application
- Can create games
- Can view game history
- Any other required permissions

## 5. Security Considerations

- Use a dedicated test user (not your personal account)
- Use a strong password for the test user
- Consider using Auth0's test mode if available
- Never commit real credentials to version control
- Use environment variables for all sensitive data 