import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Logout Manual Test', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('manual logout verification', async ({ page }) => {
    // Navigate to app
    await helpers.navigateToApp()
    
    // Check if authenticated
    const isAuthenticated = await helpers.isAuthenticated()
    
    if (!isAuthenticated) {
      console.log('User not authenticated - skipping manual logout test')
      return
    }

    console.log('✅ User is authenticated')
    console.log('Current URL:', page.url())

    // Check localStorage before logout
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

    console.log('📦 localStorage before logout:', Object.keys(localStorageBefore))

    // Perform logout
    console.log('🚪 Performing logout...')
    await helpers.logout()

    // Check final state
    console.log('📍 Final URL:', page.url())
    
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

    console.log('📦 localStorage after logout:', Object.keys(localStorageAfter))
    
    // Verify logout was successful
    const hasAuth0Data = Object.keys(localStorageAfter).some(key => 
      key.includes('@@auth0spajs@@') || key.includes('auth0') || key.includes('Auth0')
    )
    const hasCurrentGameId = Object.keys(localStorageAfter).some(key => key === 'currentGameId')
    
    console.log('🔍 Auth0 data cleared:', !hasAuth0Data)
    console.log('🔍 Game state cleared:', !hasCurrentGameId)
    
    expect(hasAuth0Data).toBe(false)
    expect(hasCurrentGameId).toBe(false)
    
    console.log('✅ Logout test completed successfully!')
  })
}) 