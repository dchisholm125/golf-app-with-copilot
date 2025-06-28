import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Logout Functionality', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should completely clear Auth0 and localStorage on logout', async ({ page }) => {
    // Navigate to app and check if authenticated
    await helpers.navigateToApp()
    
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (!isAuthenticated) {
      console.log('User not authenticated - skipping logout test')
      return
    }

    // Check that localStorage has Auth0 data before logout
    const localStorageBefore = await page.evaluate(() => {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items[key] = localStorage.getItem(key) || ''
        }
      }
      return items
    })

    console.log('localStorage before logout:', Object.keys(localStorageBefore))
    
    // Verify we have Auth0 data
    const hasAuth0Data = Object.keys(localStorageBefore).some(key => 
      key.includes('@@auth0spajs@@') || key.includes('auth0') || key.includes('Auth0')
    )
    expect(hasAuth0Data).toBe(true)

    // Perform logout
    await helpers.logout()

    // Verify we're redirected to either Auth0 login page or our app's login page
    const currentUrl = page.url()
    const isAuth0LoginPage = currentUrl.includes('auth0.com') && currentUrl.includes('login')
    const isAppLoginPage = currentUrl.includes('localhost') && currentUrl.includes('login')
    
    expect(isAuth0LoginPage || isAppLoginPage).toBe(true)
    
    // If we're on Auth0 login page, we should see Auth0 login form
    // If we're on our app's login page, we should see our login button
    if (isAuth0LoginPage) {
      await expect(page.locator('input[name="username"], input[name="email"]')).toBeVisible()
    } else {
      await expect(page.locator('button:has-text("Login")')).toBeVisible()
    }

    // Check that localStorage is cleared
    const localStorageAfter = await page.evaluate(() => {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items[key] = localStorage.getItem(key) || ''
        }
      }
      return items
    })

    console.log('localStorage after logout:', Object.keys(localStorageAfter))
    
    // Verify Auth0 data is cleared
    const hasAuth0DataAfter = Object.keys(localStorageAfter).some(key => 
      key.includes('@@auth0spajs@@') || key.includes('auth0') || key.includes('Auth0')
    )
    expect(hasAuth0DataAfter).toBe(false)

    // Verify currentGameId is cleared
    const hasCurrentGameId = Object.keys(localStorageAfter).some(key => 
      key === 'currentGameId'
    )
    expect(hasCurrentGameId).toBe(false)

    // Try to access a protected route - should redirect to login
    await page.goto('/game-select')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should require re-authentication after logout', async ({ page }) => {
    // Navigate to app and check if authenticated
    await helpers.navigateToApp()
    
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (!isAuthenticated) {
      console.log('User not authenticated - skipping re-auth test')
      return
    }

    // Perform logout
    await helpers.logout()

    // Try to access protected routes
    const protectedRoutes = ['/', '/game-select', '/history']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should redirect to either Auth0 login or our app's login
      const currentUrl = page.url()
      const isAuth0LoginPage = currentUrl.includes('auth0.com') && currentUrl.includes('login')
      const isAppLoginPage = currentUrl.includes('localhost') && currentUrl.includes('login')
      
      expect(isAuth0LoginPage || isAppLoginPage).toBe(true)
    }

    // Verify no user data is visible
    await expect(page.locator('[data-testid="user-avatar"]')).not.toBeVisible()
    await expect(page.locator('button:has-text("Profile")')).not.toBeVisible()
  })

  test('should clear game state on logout', async ({ page }) => {
    // Navigate to app and check if authenticated
    await helpers.navigateToApp()
    
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (!isAuthenticated) {
      console.log('User not authenticated - skipping game state test')
      return
    }

    // Set some game state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('currentGameId', '123')
      localStorage.setItem('testGameState', 'some-game-data')
    })

    // Verify game state is set
    const gameStateBefore = await page.evaluate(() => {
      return {
        currentGameId: localStorage.getItem('currentGameId'),
        testGameState: localStorage.getItem('testGameState')
      }
    })
    
    expect(gameStateBefore.currentGameId).toBe('123')
    expect(gameStateBefore.testGameState).toBe('some-game-data')

    // Perform logout
    await helpers.logout()

    // Check that game state is cleared
    const gameStateAfter = await page.evaluate(() => {
      return {
        currentGameId: localStorage.getItem('currentGameId'),
        testGameState: localStorage.getItem('testGameState')
      }
    })
    
    expect(gameStateAfter.currentGameId).toBeNull()
    expect(gameStateAfter.testGameState).toBeNull()
  })
}) 