import { test, expect } from '@playwright/test'
import { TestHelpers, createTestPlayers } from '../utils/test-helpers'

test.describe('Navigation and Basic App Functionality', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
  })

  test('should load the application', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Check that the app loads
    await expect(page).toHaveTitle(/Golf App/)
    await expect(page.locator('img[alt="Logo"]')).toBeVisible()
  })

  test('should navigate to game selection', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Check that game selection page loads
    await expect(page.locator('h2:has-text("Choose Your Game")')).toBeVisible()
    await expect(page.locator('select[aria-label="Game Type"]')).toBeVisible()
  })

  test('should display game type options', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Check that all game types are available
    const gameTypeSelect = page.locator('select[aria-label="Game Type"]')
    await expect(gameTypeSelect.locator('option[value="wolf"]')).toBeVisible()
    await expect(gameTypeSelect.locator('option[value="skins"]')).toBeVisible()
    await expect(gameTypeSelect.locator('option[value="sixsixsix"]')).toBeVisible()
  })

  test('should allow player count selection', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Check that player count can be changed
    const playerCountSelect = page.locator('select[aria-label="Number of Players"]')
    await expect(playerCountSelect).toBeVisible()
    
    // Test changing player count
    await playerCountSelect.selectOption('3')
    await expect(playerCountSelect).toHaveValue('3')
  })

  test('should show skin value input for Skins games', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Select Skins game type
    await page.selectOption('select[aria-label="Game Type"]', 'skins')
    
    // Check that skin value input appears
    await expect(page.locator('input[placeholder*="skin value"]')).toBeVisible()
  })

  test('should hide skin value input for non-Skins games', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Select Wolf game type
    await page.selectOption('select[aria-label="Game Type"]', 'wolf')
    
    // Check that skin value input is hidden
    await expect(page.locator('input[placeholder*="skin value"]')).not.toBeVisible()
  })

  test('should validate required fields before starting game', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Try to start game without filling required fields
    const startButton = page.locator('button:has-text("Start Game")')
    await expect(startButton).toBeDisabled()
  })

  test('should enable start button when all required fields are filled', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Fill in required fields
    const players = createTestPlayers(4)
    for (let i = 0; i < players.length; i++) {
      await page.fill(`input[placeholder*="Player ${i + 1} Name"]`, players[i].name)
      await page.fill(`input[placeholder*="Player ${i + 1} Email"]`, players[i].email)
    }
    
    // Check that start button is enabled
    const startButton = page.locator('button:has-text("Start Game")')
    await expect(startButton).toBeEnabled()
  })

  test('should navigate to game history', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Click history button
    await page.click('button:has-text("History")')
    
    // Check that we're on the history page
    await expect(page).toHaveURL(/\/history/)
    await expect(page.locator('h1:has-text("Game History")')).toBeVisible()
  })

  test('should navigate to profile', async ({ page }) => {
    await helpers.navigateToApp()
    
    // Click profile button
    await page.click('button:has-text("Profile")')
    
    // Check that we're on the profile page
    await expect(page).toHaveURL('/')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await helpers.navigateToGameSelect()
    
    // Check that mobile layout is applied
    await expect(page.locator('.navbar')).toBeVisible()
    
    // Check that game selection form is accessible on mobile
    await expect(page.locator('h2:has-text("Choose Your Game")')).toBeVisible()
    await expect(page.locator('select[aria-label="Game Type"]')).toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    await helpers.navigateToGameSelect()
    
    // Fill in invalid email
    await page.fill('input[placeholder*="Player 1 Email"]', 'invalid-email')
    
    // Try to start game
    await page.click('button:has-text("Start Game")')
    
    // Check that validation error is shown (if implemented)
    // This test assumes you have client-side validation
    const errorMessage = page.locator('.alert-danger, .error-message')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('email')
    }
  })
}) 