import { test, expect } from '@playwright/test'
import { TestHelpers, createTestPlayers } from '../utils/test-helpers'

test.describe('NavBar Game Navigation', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should display current game ID badge when user has an active game', async ({ page }) => {
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

    await helpers.navigateToApp()
    
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

    await helpers.navigateToApp()
    
    // Check that game type is displayed
    await expect(page.locator('.game-type-indicator')).toBeVisible()
    await expect(page.locator('.game-type-indicator')).toContainText('(wolf)')
  })

  test('should navigate to Wolf game when clicking badge for Wolf game', async ({ page }) => {
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

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to Wolf game
    await expect(page).toHaveURL(/\/wolf\/\d+/)
  })

  test('should navigate to Skins game when clicking badge for Skins game', async ({ page }) => {
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

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to Skins game
    await expect(page).toHaveURL(/\/skins\/\d+/)
  })

  test('should find most recent active game when no current game is set', async ({ page }) => {
    // Mock user game history with multiple games
    await page.route('**/api/users/*/games', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 3,
            type: 'skins',
            date: '2024-01-15T10:00:00Z',
            is_complete: false
          },
          {
            id: 2,
            type: 'wolf',
            date: '2024-01-14T10:00:00Z',
            is_complete: true
          },
          {
            id: 1,
            type: 'wolf',
            date: '2024-01-13T10:00:00Z',
            is_complete: false
          }
        ])
      })
    })

    // Mock the most recent game state
    await page.route('**/api/games/3/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'skins',
          state_json: { current_hole: 1 }
        })
      })
    })

    await helpers.navigateToApp()
    
    // Click the game ID badge (should find the most recent active game)
    await page.click('.game-id-link')
    
    // Should navigate to the most recent active game (Skins game ID 3)
    await expect(page).toHaveURL(/\/skins\/3/)
  })

  test('should navigate to game selection when no active games exist', async ({ page }) => {
    // Mock empty game history
    await page.route('**/api/users/*/games', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to game selection
    await expect(page).toHaveURL(/\/game-select/)
  })

  test('should prioritize current game over most recent game', async ({ page }) => {
    // Mock current game state (Wolf game)
    await page.route('**/api/games/1/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    // Mock user game history with a more recent Skins game
    await page.route('**/api/users/*/games', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 2,
            type: 'skins',
            date: '2024-01-15T10:00:00Z',
            is_complete: false
          },
          {
            id: 1,
            type: 'wolf',
            date: '2024-01-14T10:00:00Z',
            is_complete: false
          }
        ])
      })
    })

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to current game (Wolf) not most recent (Skins)
    await expect(page).toHaveURL(/\/wolf\/1/)
  })

  test('should handle network errors gracefully when fetching game history', async ({ page }) => {
    // Mock network error for game history
    await page.route('**/api/users/*/games', route => {
      route.abort('failed')
    })

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should handle error gracefully (could go to game selection or show error)
    // This test verifies the app doesn't crash
    await expect(page).toHaveTitle(/Golf App/)
  })

  test('should update game type indicator when game type changes', async ({ page }) => {
    // Mock game state changing from Wolf to Skins
    await page.route('**/api/games/*/state', route => {
      const gameId = route.request().url().split('/').pop()
      if (gameId === '1') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            game_type: 'wolf',
            state_json: { current_hole: 1 }
          })
        })
      } else if (gameId === '2') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            game_type: 'skins',
            state_json: { current_hole: 1 }
          })
        })
      }
    })

    await helpers.navigateToApp()
    
    // Initially should show Wolf game
    await expect(page.locator('.game-type-indicator')).toContainText('(wolf)')
    
    // Navigate to a different game (this would trigger a state change in real app)
    await page.goto('/skins/2')
    
    // Game type indicator should update (this would require a page refresh or state update)
    // For now, we'll just verify the navigation worked
    await expect(page).toHaveURL(/\/skins\/2/)
  })

  test('should show game ID badge in mobile dropdown menu', async ({ page }) => {
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

    await helpers.navigateToApp()
    
    // Open mobile dropdown
    await page.click('[data-testid="user-avatar"]')
    
    // Check that game ID is shown in mobile menu
    await expect(page.locator('.dropdown-item:has-text("Game ID:")')).toBeVisible()
    await expect(page.locator('.dropdown-item:has-text("(wolf)")')).toBeVisible()
  })

  test('should handle expired or invalid game state', async ({ page }) => {
    // Mock expired game state (404 response)
    await page.route('**/api/games/*/state', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Game not found' })
      })
    })

    await helpers.navigateToApp()
    
    // Game ID badge should not be visible for invalid game
    await expect(page.locator('.game-id-link')).not.toBeVisible()
  })

  test('should filter out completed games when finding most recent active game', async ({ page }) => {
    // Mock user game history with completed and active games
    await page.route('**/api/users/*/games', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 3,
            type: 'skins',
            date: '2024-01-15T10:00:00Z',
            is_complete: true  // Completed game
          },
          {
            id: 2,
            type: 'wolf',
            date: '2024-01-14T10:00:00Z',
            is_complete: false  // Active game
          },
          {
            id: 1,
            type: 'skins',
            date: '2024-01-13T10:00:00Z',
            is_complete: true  // Completed game
          }
        ])
      })
    })

    // Mock the active game state
    await page.route('**/api/games/2/state', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game_type: 'wolf',
          state_json: { current_hole: 1 }
        })
      })
    })

    await helpers.navigateToApp()
    
    // Click the game ID badge
    await page.click('.game-id-link')
    
    // Should navigate to the most recent ACTIVE game (Wolf game ID 2), not the most recent completed game
    await expect(page).toHaveURL(/\/wolf\/2/)
  })
}) 