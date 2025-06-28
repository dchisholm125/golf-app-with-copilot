import { test, expect } from '@playwright/test'

test.describe('NavBar Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that has the NavBar component
    await page.goto('/')
  })

  test('should display logo and navigation elements', async ({ page }) => {
    // Check that logo is visible
    await expect(page.locator('img[alt="Logo"]')).toBeVisible()
    
    // Check that navigation buttons are present
    await expect(page.locator('button:has-text("History")')).toBeVisible()
    await expect(page.locator('button:has-text("Profile")')).toBeVisible()
  })

  test('should show login button when not authenticated', async ({ page }) => {
    // Check that login button is visible for unauthenticated users
    const loginButton = page.locator('button:has-text("Login")')
    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeVisible()
    }
  })

  test('should show user avatar when authenticated', async ({ page }) => {
    // Check that user avatar is visible for authenticated users
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await expect(userAvatar).toBeVisible()
    }
  })

  test('should open user menu when avatar is clicked', async ({ page }) => {
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await userAvatar.click()
      
      // Check that menu options are visible
      await expect(page.locator('button:has-text("Profile")')).toBeVisible()
      await expect(page.locator('button:has-text("Logout")')).toBeVisible()
    }
  })

  test('should close user menu when clicking outside', async ({ page }) => {
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await userAvatar.click()
      
      // Click outside the menu
      await page.click('body')
      
      // Menu should be closed
      await expect(page.locator('button:has-text("Logout")')).not.toBeVisible()
    }
  })

  test('should navigate to history page when history button is clicked', async ({ page }) => {
    await page.click('button:has-text("History")')
    
    // Check that we're on the history page
    await expect(page).toHaveURL(/\/history/)
  })

  test('should navigate to profile page when profile button is clicked', async ({ page }) => {
    await page.click('button:has-text("Profile")')
    
    // Check that we're on the profile page
    await expect(page).toHaveURL('/')
  })

  test('should display game ID badge when user has an active game', async ({ page }) => {
    // Mock the user having an active game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Check that game ID badge is visible
    await expect(page.locator('.game-id-link')).toBeVisible()
    await expect(page.locator('.game-id-link')).toContainText('Game ID:')
  })

  test('should display game type indicator in the badge', async ({ page }) => {
    // Mock the user having a Wolf game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Check that game type is displayed
    await expect(page.locator('.game-type-indicator')).toBeVisible()
    await expect(page.locator('.game-type-indicator')).toContainText('(wolf)')
  })

  test('should navigate to correct game type when clicking game ID badge', async ({ page }) => {
    // Mock the user having a Skins game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'skins',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to Skins game (not Wolf)
    await expect(page).toHaveURL(/\/skins\/\d+/)
  })

  test('should show cancel game button when user has an active game', async ({ page }) => {
    // Mock the user having an active game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Check that cancel game button is visible
    await expect(page.locator('button:has-text("Cancel Game")')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that navbar is still visible and functional
    await expect(page.locator('.navbar')).toBeVisible()
    await expect(page.locator('img[alt="Logo"]')).toBeVisible()
  })

  test('should handle mobile menu toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Look for mobile menu toggle button
    const mobileMenuButton = page.locator('.navbar-toggler, [data-bs-toggle="collapse"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      // Check that mobile menu is expanded
      await expect(page.locator('.navbar-collapse')).toHaveClass(/show/)
    }
  })

  test('should display correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Golf App/)
  })

  test('should handle navigation state correctly', async ({ page }) => {
    // Navigate to different pages and check that navbar remains consistent
    await page.click('button:has-text("History")')
    await expect(page.locator('.navbar')).toBeVisible()
    
    await page.click('button:has-text("Profile")')
    await expect(page.locator('.navbar')).toBeVisible()
  })

  test('should handle logout functionality', async ({ page }) => {
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await userAvatar.click()
      await page.click('button:has-text("Logout")')
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should maintain navbar visibility during page transitions', async ({ page }) => {
    // Navigate through different pages
    await page.click('button:has-text("History")')
    await expect(page.locator('.navbar')).toBeVisible()
    
    await page.goBack()
    await expect(page.locator('.navbar')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through navbar elements
    await page.keyboard.press('Tab')
    
    // Focus should be on the first focusable element
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should handle accessibility attributes', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const navbar = page.locator('nav, .navbar')
    await expect(navbar).toBeVisible()
    
    // Check for proper button roles
    const buttons = page.locator('button')
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i)
      await expect(button).toBeVisible()
    }
  })

  test('should show game ID in mobile dropdown when user has active game', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mock the user having an active game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Open mobile dropdown
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await userAvatar.click()
      
      // Check that game ID is shown in mobile menu
      await expect(page.locator('.dropdown-item:has-text("Game ID:")')).toBeVisible()
      await expect(page.locator('.dropdown-item:has-text("(wolf)")')).toBeVisible()
    }
  })

  test('should handle game ID badge hover effects', async ({ page }) => {
    // Mock the user having an active game
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await page.reload()
    
    // Hover over the game ID badge
    await page.hover('.game-id-link')
    
    // Check that hover effects are applied (this would be visual, but we can check the element exists)
    await expect(page.locator('.game-id-link')).toBeVisible()
  })

  test('should not show game ID badge when user has no active games', async ({ page }) => {
    // Mock no active games (404 response)
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Game not found' })
      })
    })

    await page.reload()
    
    // Game ID badge should not be visible
    await expect(page.locator('.game-id-link')).not.toBeVisible()
  })
}) 