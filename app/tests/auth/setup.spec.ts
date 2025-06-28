import { test } from '@playwright/test'

test.describe('Auth Setup', () => {
  test('setup auth state', async ({ page }) => {
    // This test exists only to trigger authentication and create auth-state.json
    console.log('Auth setup test running - this will create auth-state.json')
    
    // Navigate to the app
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if we're already authenticated
    const isAuthenticated = await page.locator('[data-testid="user-avatar"], .user-avatar, .avatar').isVisible().catch(() => false)
    
    if (isAuthenticated) {
      console.log('✅ Already authenticated - saving current state')
    } else {
      console.log('🔐 Not authenticated - starting login process')
      
      // Check if we're on Auth0 page
      const isAuth0Page = page.url().includes('auth0.com')
      if (isAuth0Page) {
        console.log('On Auth0 login page - using dummy credentials')
        
        // Look for Auth0 login form elements
        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const loginButton = page.locator('button[type="submit"]')
        
        // Wait for login form to be visible
        await usernameInput.waitFor({ timeout: 10000 })
        console.log('Auth0 login form found')
        
        // Fill in dummy credentials
        const testEmail = 'dev@dev.dev'
        const testPassword = 'DEVdev1!'
        
        console.log(`Logging in with dummy user: ${testEmail}`)
        
        // Fill in credentials
        await usernameInput.fill(testEmail)
        await passwordInput.fill(testPassword)
        
        // Submit the form
        await loginButton.click()
        
        // Wait for redirect back to the app or to the consent screen
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000) // Give time for auth to process
        
        // Check if we're on the consent screen and need to click Accept
        const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Allow"), [data-action="allow"]')
        if (await acceptButton.isVisible({ timeout: 5000 })) {
          console.log('Found consent screen - clicking Accept')
          await acceptButton.click()
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(2000) // Give time for redirect
        }
        
        // Wait for redirect back to the app
        await page.waitForURL('http://localhost:5173/**', { timeout: 30000 })
        console.log('Successfully authenticated and redirected to app')
        
        // Verify we're authenticated
        const avatar = page.locator('[data-testid="user-avatar"], .user-avatar, .avatar')
        if (await avatar.isVisible({ timeout: 5000 })) {
          console.log('Authentication successful - user avatar visible')
        } else {
          console.log('Avatar not found, but redirected to app - authentication likely succeeded')
        }
      } else {
        // Try to find regular login form
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]')
        const passwordInput = page.locator('input[type="password"], input[name="password"]')
        const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
        
        // Wait for login form to be visible
        await emailInput.waitFor({ timeout: 10000 })
        console.log('Regular login form found')
        
        // Fill in dummy credentials
        const testEmail = 'dev@dev.dev'
        const testPassword = 'DEVdev1!'
        
        console.log(`Logging in with dummy user: ${testEmail}`)
        
        // Fill in credentials
        await emailInput.fill(testEmail)
        await passwordInput.fill(testPassword)
        
        // Submit the form
        await loginButton.click()
        
        // Wait for redirect or authentication to complete
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000) // Give time for auth to process
        
        console.log('Login submitted - checking authentication status')
        
        // Verify we're authenticated
        const avatar = page.locator('[data-testid="user-avatar"], .user-avatar, .avatar')
        if (await avatar.isVisible({ timeout: 5000 })) {
          console.log('Authentication successful - user avatar visible')
        } else {
          // Check if we're on a different page or if auth succeeded in a different way
          console.log('Avatar not found, checking current URL:', page.url())
          console.log('Page title:', await page.title())
          
          // If we're not on the login page anymore, assume auth succeeded
          const stillOnLoginPage = await emailInput.isVisible().catch(() => false)
          if (!stillOnLoginPage) {
            console.log('No longer on login page - authentication likely succeeded')
          } else {
            throw new Error('Authentication failed - still on login page')
          }
        }
      }
    }
    
    // Save signed-in state
    await page.context().storageState({ path: 'tests/auth-state.json' })
    console.log('✅ Authentication state saved to: tests/auth-state.json')
  })
}) 