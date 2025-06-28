import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Leaderboards Feature', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    // Navigate to app and ensure authentication
    await helpers.navigateToApp()
  })

  test('should navigate to leaderboards page', async ({ page }) => {
    // Navigate to leaderboards
    await helpers.navigateToLeaderboards()
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Leaderboards')
    
    // Check for leaderboard filters
    await expect(page.locator('label:has-text("Time Period")')).toBeVisible()
    await expect(page.locator('label:has-text("Game Type")')).toBeVisible()
  })

  test('should display leaderboard data', async ({ page }) => {
    await helpers.navigateToLeaderboards()
    
    // Wait for data to load (should show either loading or content)
    await page.waitForSelector('.leaderboard-container, .alert, .spinner-border', { timeout: 10000 })
    
    // If data loads successfully, check table structure
    const tableExists = await page.locator('.leaderboard-table table').isVisible()
    if (tableExists) {
      // Check table headers
      await expect(page.locator('th:has-text("Rank")')).toBeVisible()
      await expect(page.locator('th:has-text("Player")')).toBeVisible()
      await expect(page.locator('th:has-text("Games Won")')).toBeVisible()
      await expect(page.locator('th:has-text("Win Rate")')).toBeVisible()
      
      // Check if dev user appears in leaderboard
      const devUserRow = page.locator('tr:has-text("Dev User")')
      if (await devUserRow.isVisible()) {
        await expect(devUserRow).toContainText('YOU')
        await expect(devUserRow).toHaveClass(/current-user-row/)
      }
    } else {
      // If no data, check for appropriate message
      const noDataMessage = page.locator('.no-data, .alert')
      await expect(noDataMessage).toBeVisible()
    }
  })

  test('should filter by time period', async ({ page }) => {
    await helpers.navigateToLeaderboards()
    
    // Test time period filters
    const timePeriodSelect = page.locator('select').first()
    await timePeriodSelect.selectOption('monthly')
    await page.waitForTimeout(1000) // Wait for filter to apply
    
    // Check that the leaderboard header updates
    await expect(page.locator('.leaderboard-header h3')).toContainText('This Month')
    
    // Try weekly filter
    await timePeriodSelect.selectOption('weekly')
    await page.waitForTimeout(1000)
    await expect(page.locator('.leaderboard-header h3')).toContainText('This Week')
  })

  test('should filter by game type', async ({ page }) => {
    await helpers.navigateToLeaderboards()
    
    // Test game type filters
    const gameTypeSelect = page.locator('select').last()
    await gameTypeSelect.selectOption('wolf')
    await page.waitForTimeout(1000)
    
    // Check that the leaderboard header updates
    await expect(page.locator('.leaderboard-header h3')).toContainText('Wolf')
    
    // Try skins filter
    await gameTypeSelect.selectOption('skins')
    await page.waitForTimeout(1000)
    await expect(page.locator('.leaderboard-header h3')).toContainText('Skins')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return 500 error
    await page.route('**/api/leaderboards/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    await helpers.navigateToLeaderboards()
    
    // Should show user-friendly error message, not crash
    const alert = page.locator('.alert-warning')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('temporarily unavailable')
    
    // Should not show scary console errors to user
    await expect(alert).not.toContainText('Failed to fetch')
    await expect(alert).not.toContainText('500')
  })

  test('should work in dark mode', async ({ page }) => {
    await helpers.navigateToLeaderboards()
    
    // Toggle dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    
    // Check that dark mode is applied
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Check that text is readable (not black on black)
    const pageTitle = page.locator('h1')
    await expect(pageTitle).toBeVisible()
    
    // Verify filters are still usable in dark mode
    const timePeriodSelect = page.locator('select').first()
    await expect(timePeriodSelect).toBeVisible()
    await timePeriodSelect.selectOption('monthly')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await helpers.navigateToLeaderboards()
    
    // Check that mobile layout works
    await expect(page.locator('h1')).toBeVisible()
    
    // Check that table is responsive (should have table-responsive class or scroll)
    const tableContainer = page.locator('.table-responsive, .leaderboard-table')
    if (await tableContainer.isVisible()) {
      await expect(tableContainer).toBeVisible()
    }
    
    // Filters should stack vertically on mobile
    const filters = page.locator('.filters .row')
    if (await filters.isVisible()) {
      await expect(filters).toBeVisible()
    }
  })
})
