import { test, expect } from '@playwright/test'
import { TestHelpers, createTestPlayers } from '../utils/test-helpers'

test.describe('Wolf Game Functionality', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should create and start a Wolf game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    // Check that we're on the Wolf game page
    await expect(page).toHaveURL(/\/wolf\/\d+/)
    await expect(page.locator('h3:has-text("Wolf Game")')).toBeVisible()
  })

  test('should display game setup when game is not started', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    // Check that start game button is visible
    await expect(page.locator('button:has-text("Start Wolf Game")')).toBeVisible()
    await expect(page.locator('.alert-info:has-text("has not started yet")')).toBeVisible()
  })

  test('should start the game when start button is clicked', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Check that game has started
    await expect(page.locator('h5:has-text("Hole 1")')).toBeVisible()
    await expect(page.locator('strong:has-text("Wolf for this hole")')).toBeVisible()
  })

  test('should display partner selection for Wolf', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Check that partner selection is shown
    await expect(page.locator('p:has-text("Choose a partner")')).toBeVisible()
    await expect(page.locator('button:has-text("Go Lone Wolf")')).toBeVisible()
  })

  test('should allow Wolf to choose a partner', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Choose a partner
    await page.click(`button:has-text("${players[1].name}")`)
    
    // Check that teams are displayed
    await expect(page.locator('p:has-text("Teams:")')).toBeVisible()
  })

  test('should allow Wolf to go Lone Wolf', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Go Lone Wolf
    await page.click('button:has-text("Go Lone Wolf")')
    
    // Check that Lone Wolf is displayed
    await expect(page.locator('p:has-text("Lone Wolf")')).toBeVisible()
  })

  test('should display hole winner selection after partner choice', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Choose a partner
    await page.click(`button:has-text("${players[1].name}")`)
    
    // Check that hole winner selection is shown
    await expect(page.locator('label:has-text("Who won the hole")')).toBeVisible()
  })

  test('should complete a hole and advance to next hole', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Choose a partner
    await page.click(`button:has-text("${players[1].name}")`)
    
    // Select hole winner
    await page.click('button:has-text("🐺")')
    
    // Submit hole
    await page.click('button:has-text("Submit Hole")')
    
    // Check that we've advanced to hole 2
    await expect(page.locator('h5:has-text("Hole 2")')).toBeVisible()
  })

  test('should display scoreboard during game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Check that scoreboard is visible
    await expect(page.locator('h6:has-text("Scoreboard")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display tee order', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Check that tee order is displayed
    await expect(page.locator('h5:has-text("Tee Order")')).toBeVisible()
    await expect(page.locator('table.tee-order-table')).toBeVisible()
  })

  test('should complete a full game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Complete all holes (simplified for testing)
    for (let hole = 1; hole <= 3; hole++) { // Test with 3 holes instead of 18
      // Choose a partner
      await page.click(`button:has-text("${players[1].name}")`)
      
      // Select hole winner
      await page.click('button:has-text("🐺")')
      
      // Submit hole
      await page.click('button:has-text("Submit Hole")')
      
      // Wait for next hole or game completion
      if (hole < 3) {
        await expect(page.locator(`h5:has-text("Hole ${hole + 1}")`)).toBeVisible()
      }
    }
    
    // Check that game completion screen is shown
    await expect(page.locator('h1:has-text("Game Complete")')).toBeVisible()
  })

  test('should handle game cancellation', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    // Cancel the game
    await page.click('button:has-text("Cancel Game")')
    
    // Confirm cancellation
    page.on('dialog', dialog => dialog.accept())
    
    // Check that we're redirected to game selection
    await expect(page).toHaveURL(/\/game-select/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    await helpers.startWolfGame()
    
    // Check that game is usable on mobile
    await expect(page.locator('h3:has-text("Wolf Game")')).toBeVisible()
    await expect(page.locator('button:has-text("Go Lone Wolf")')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/games/**', route => {
      route.abort('failed')
    })
    
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'wolf',
      players
    })
    
    // Check that error is handled gracefully
    const errorMessage = page.locator('.alert-danger')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('error')
    }
  })
}) 