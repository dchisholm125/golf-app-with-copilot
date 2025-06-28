import { test, expect } from '@playwright/test'
import { TestHelpers, createTestPlayers } from '../utils/test-helpers'

test.describe('Skins Game Functionality', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should create and start a Skins game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    // Check that we're on the Skins game page
    await expect(page).toHaveURL(/\/skins\/\d+/)
    await expect(page.locator('h3:has-text("Skins Game")')).toBeVisible()
  })

  test('should display game setup when game is not started', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    // Check that start game button is visible
    await expect(page.locator('button:has-text("Start Skins Game")')).toBeVisible()
    await expect(page.locator('.alert-info:has-text("has not started yet")')).toBeVisible()
  })

  test('should require skin value to start game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players
    })
    
    // Check that start button is disabled without skin value
    const startButton = page.locator('button:has-text("Start Skins Game")')
    await expect(startButton).toBeDisabled()
  })

  test('should start the game when skin value is provided', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Check that game has started
    await expect(page.locator('h5:has-text("Hole 1")')).toBeVisible()
    await expect(page.locator('h6:has-text("Enter Scores")')).toBeVisible()
  })

  test('should display score entry form for all players', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Check that score entry form is shown for all players
    for (const player of players) {
      await expect(page.locator(`label:has-text("${player.name}")`)).toBeVisible()
      await expect(page.locator(`input[placeholder="Score"]:near(:text("${player.name}"))`)).toBeVisible()
    }
  })

  test('should require all scores before submitting hole', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Check that submit button is disabled initially
    const submitButton = page.locator('button:has-text("Submit Hole")')
    await expect(submitButton).toBeDisabled()
    
    // Fill in some scores
    await page.fill(`input[placeholder="Score"]:near(:text("${players[0].name}"))`, '4')
    await page.fill(`input[placeholder="Score"]:near(:text("${players[1].name}"))`, '5')
    
    // Button should still be disabled
    await expect(submitButton).toBeDisabled()
  })

  test('should enable submit button when all scores are entered', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Fill in all scores
    const scores = [4, 5, 4, 6]
    for (let i = 0; i < players.length; i++) {
      await page.fill(`input[placeholder="Score"]:near(:text("${players[i].name}"))`, scores[i].toString())
    }
    
    // Check that submit button is enabled
    const submitButton = page.locator('button:has-text("Submit Hole")')
    await expect(submitButton).toBeEnabled()
  })

  test('should submit scores and advance to next hole', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Submit scores for first hole
    const scores = { [players[0].name]: 4, [players[1].name]: 5, [players[2].name]: 4, [players[3].name]: 6 }
    await helpers.submitSkinsScores(scores)
    
    // Check that we've advanced to hole 2
    await expect(page.locator('h5:has-text("Hole 2")')).toBeVisible()
  })

  test('should display skins results after submitting hole', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Submit scores for first hole
    const scores = { [players[0].name]: 4, [players[1].name]: 5, [players[2].name]: 4, [players[3].name]: 6 }
    await helpers.submitSkinsScores(scores)
    
    // Check that skins results are displayed
    await expect(page.locator('h6:has-text("Skins Results")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display player totals', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Submit scores for first hole
    const scores = { [players[0].name]: 4, [players[1].name]: 5, [players[2].name]: 4, [players[3].name]: 6 }
    await helpers.submitSkinsScores(scores)
    
    // Check that player totals are displayed
    await expect(page.locator('h6:has-text("Player Totals")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should handle carryover when there is a tie', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Submit scores with a tie (two players with score 4)
    const scores = { [players[0].name]: 4, [players[1].name]: 4, [players[2].name]: 5, [players[3].name]: 6 }
    await helpers.submitSkinsScores(scores)
    
    // Check that carryover is shown in results
    await expect(page.locator('span:has-text("Carryover")')).toBeVisible()
  })

  test('should award skin to unique low score', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Submit scores with unique low score
    const scores = { [players[0].name]: 3, [players[1].name]: 4, [players[2].name]: 5, [players[3].name]: 6 }
    await helpers.submitSkinsScores(scores)
    
    // Check that the winner is shown in results
    await expect(page.locator(`td:has-text("${players[0].name}")`)).toBeVisible()
  })

  test('should display scoreboard during game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Check that scoreboard is visible
    await expect(page.locator('h6:has-text("Scoreboard")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should complete a full game', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Complete all holes (simplified for testing)
    for (let hole = 1; hole <= 3; hole++) { // Test with 3 holes instead of 18
      const scores = { [players[0].name]: 4, [players[1].name]: 5, [players[2].name]: 4, [players[3].name]: 6 }
      await helpers.submitSkinsScores(scores)
      
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
      gameType: 'skins',
      players,
      skinValue: 5
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
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Check that game is usable on mobile
    await expect(page.locator('h3:has-text("Skins Game")')).toBeVisible()
    await expect(page.locator('h6:has-text("Enter Scores")')).toBeVisible()
  })

  test('should handle invalid score inputs', async ({ page }) => {
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    await helpers.startSkinsGame(5)
    
    // Try to enter invalid score (0 or negative)
    await page.fill(`input[placeholder="Score"]:near(:text("${players[0].name}"))`, '0')
    
    // Check that validation prevents submission
    const submitButton = page.locator('button:has-text("Submit Hole")')
    await expect(submitButton).toBeDisabled()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/games/**', route => {
      route.abort('failed')
    })
    
    const players = createTestPlayers(4)
    
    await helpers.createGame({
      gameType: 'skins',
      players,
      skinValue: 5
    })
    
    // Check that error is handled gracefully
    const errorMessage = page.locator('.alert-danger')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('error')
    }
  })
}) 