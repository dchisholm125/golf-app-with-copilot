import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Authentication Flow', () => {
  let testHelpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    testHelpers = new TestHelpers(page)
  })

  test('should handle Auth0 login automatically', async ({ page }) => {
    // Navigate to the app - this should trigger authentication if needed
    await testHelpers.navigateToApp()
    
    // Verify we're authenticated
    const isAuthenticated = await testHelpers.isAuthenticated()
    expect(isAuthenticated).toBe(true)
    
    // Check that we can see the user avatar
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    await expect(userAvatar).toBeVisible()
  })

  test('should access protected pages after authentication', async ({ page }) => {
    // Navigate to game select - this should trigger authentication if needed
    await testHelpers.navigateToGameSelect()
    
    // After authentication, we might be redirected to home page first
    // Check if we're on the home page and click "Start New Game"
    const startNewGameButton = page.locator('button:has-text("Start New Game")')
    if (await startNewGameButton.isVisible()) {
      console.log('On home page, clicking Start New Game')
      await startNewGameButton.click()
      await page.waitForLoadState('networkidle')
    }
    
    // Verify we're on the game select page - check for any heading or form elements
    const heading = page.locator('h1, h2, h3')
    await expect(heading.first()).toBeVisible()
    
    // Check that the form elements are visible (indicating we're authenticated)
    const playerSelect = page.locator('select').first()
    await expect(playerSelect).toBeVisible()
    
    // Also check for game type selection
    const gameTypeSelect = page.locator('select').nth(2)
    await expect(gameTypeSelect).toBeVisible()
  })

  test('should handle logout and re-authentication', async ({ page }) => {
    // First, navigate and authenticate
    await testHelpers.navigateToApp()
    
    // Verify we're authenticated
    expect(await testHelpers.isAuthenticated()).toBe(true)
    
    // Logout
    await testHelpers.logout()
    
    // Verify we're logged out
    expect(await testHelpers.isAuthenticated()).toBe(false)
    
    // Navigate again - this should trigger re-authentication
    await testHelpers.navigateToApp()
    
    // Verify we're authenticated again
    expect(await testHelpers.isAuthenticated()).toBe(true)
  })

  test('should work with unauthenticated project', async ({ page }) => {
    // This test should work even without the authenticated storage state
    // Navigate to the app
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if we need to authenticate
    await testHelpers.ensureAuthenticated()
    
    // Verify we're authenticated
    const isAuthenticated = await testHelpers.isAuthenticated()
    expect(isAuthenticated).toBe(true)
  })
}) 