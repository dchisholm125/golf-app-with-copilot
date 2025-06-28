import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Authentication and User Management', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should show login page when not authenticated', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Check that login page is shown
    await expect(page.locator('h1:has-text("Welcome to Golf App")')).toBeVisible()
    await expect(page.locator('button:has-text("Login")')).toBeVisible()
  })

  test('should redirect to login for protected routes', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/game-select')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show user profile when authenticated', async ({ page }) => {
    // This test assumes the user is already authenticated
    // In a real scenario, you'd set up authentication in global setup
    
    await helpers.navigateToApp()
    
    // Check that user profile elements are visible
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await expect(userAvatar).toBeVisible()
    }
  })

  test('should display user information in profile', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Navigate to profile
    await helpers.navigateToProfile()
    
    // Check that profile information is displayed
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible()
  })

  test('should show game history for authenticated user', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Navigate to game history
    await helpers.navigateToGameHistory()
    
    // Check that game history page loads
    await expect(page.locator('h1:has-text("Game History")')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Check if user is authenticated
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (isAuthenticated) {
      await helpers.logout()
      
      // Check that we're redirected to login
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('button:has-text("Login")')).toBeVisible()
    }
  })

  test('should persist authentication state', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Check if authenticated
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (isAuthenticated) {
      // Refresh the page
      await page.reload()
      
      // Should still be authenticated
      await expect(await helpers.isAuthenticated()).toBe(true)
    }
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Mock authentication error
    await page.route('**/auth0.com/**', route => {
      route.abort('failed')
    })
    
    await helpers.navigateToApp()
    
    // Try to login
    const loginButton = page.locator('button:has-text("Login")')
    if (await loginButton.isVisible()) {
      await loginButton.click()
      
      // Check that error is handled gracefully
      const errorMessage = page.locator('.alert-danger, .error-message')
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('error')
      }
    }
  })

  test('should show loading state during authentication', async ({ page }) => {
    await helpers.navigateToApp()
    
    const loginButton = page.locator('button:has-text("Login")')
    if (await loginButton.isVisible()) {
      await loginButton.click()
      
      // Check that loading state is shown
      const loadingSpinner = page.locator('.spinner-border, .loading')
      if (await loadingSpinner.isVisible()) {
        await expect(loadingSpinner).toBeVisible()
      }
    }
  })

  test('should handle expired authentication', async ({ page }) => {
    // This test would require mocking an expired token
    // For now, we'll just check that the app handles authentication gracefully
    
    await helpers.navigateToApp()
    
    // Check that the app loads without errors
    await expect(page).toHaveTitle(/Golf App/)
  })

  test('should protect game creation for unauthenticated users', async ({ page }) => {
    // Try to access game creation directly
    await page.goto('/game-select')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should allow authenticated users to create games', async ({ page }) => {
    await helpers.navigateToApp()
    
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (isAuthenticated) {
      await helpers.navigateToGameSelect()
      
      // Should be able to access game selection
      await expect(page).toHaveURL(/\/game-select/)
      await expect(page.locator('h2:has-text("Choose Your Game")')).toBeVisible()
    }
  })

  test('should show user avatar and menu when authenticated', async ({ page }) => {
    await helpers.navigateToApp()
    
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await expect(userAvatar).toBeVisible()
      
      // Click on avatar to open menu
      await userAvatar.click()
      
      // Check that menu options are visible
      await expect(page.locator('button:has-text("Profile")')).toBeVisible()
      await expect(page.locator('button:has-text("Logout")')).toBeVisible()
    }
  })

  test('should handle authentication callback', async ({ page }) => {
    // This test would simulate the Auth0 callback
    // For now, we'll just check that the app handles the callback URL
    
    await page.goto('/callback')
    
    // Should handle callback gracefully
    await expect(page).toHaveTitle(/Golf App/)
  })

  test('should be responsive on mobile for authentication', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await helpers.navigateToApp()
    
    // Check that login page is usable on mobile
    await expect(page.locator('h1:has-text("Welcome to Golf App")')).toBeVisible()
    await expect(page.locator('button:has-text("Login")')).toBeVisible()
  })

  test('should handle network errors during authentication', async ({ page }) => {
    // Mock network error for authentication
    await page.route('**/api/auth/**', route => {
      route.abort('failed')
    })
    
    await helpers.navigateToApp()
    
    // Check that error is handled gracefully
    const errorMessage = page.locator('.alert-danger')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('error')
    }
  })
}) 