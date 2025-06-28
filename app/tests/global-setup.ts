import { chromium, FullConfig } from '@playwright/test'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use
  
  // Skip authentication setup if no storage state is configured
  if (!storageState) {
    console.log('No storage state configured - skipping authentication setup')
    return
  }
  
  console.log('Setting up authentication for tests...')
  
  const browser = await chromium.launch({ headless: false }) // Set to true in CI
  const page = await browser.newPage()
  
  try {
    // Navigate to the app
    await page.goto(baseURL || 'http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    // Check if we're already authenticated
    const isAuthenticated = await page.locator('[data-testid="user-avatar"], .user-avatar, .avatar').isVisible().catch(() => false)
    
    if (isAuthenticated) {
      console.log('Already authenticated - saving current state')
    } else {
      console.log('Not authenticated - starting login process')
      
      // Look for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]')
      const passwordInput = page.locator('input[type="password"], input[name="password"]')
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
      
      // Wait for login form to be visible
      await emailInput.waitFor({ timeout: 10000 })
      console.log('Login form found')
      
      // Fill in dummy credentials
      const testEmail = 'dev@dev.dev'
      const testPassword = 'DEVdev1!'
      
      console.log(`Logging in with dummy user: ${testEmail}`)
      
      // Fill in credentials
      await emailInput.fill(testEmail)
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
      await page.waitForURL(baseURL + '/**', { timeout: 30000 })
      console.log('Successfully authenticated and redirected to app')
      
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
    
    // Save signed-in state
    await page.context().storageState({ path: storageState as string })
    console.log(`Authentication state saved to: ${storageState}`)
    
  } catch (error) {
    console.error('Authentication setup failed:', error)
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'auth-setup-error.png' })
    
    // Save the error state for debugging
    writeFileSync('auth-setup-error.log', error.toString())
    
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup 