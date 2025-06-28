import { test, expect } from '@playwright/test'

test.describe('Simple Navigation', () => {
  test('should navigate to game select page', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navigate to game select
    await page.goto('/game-select')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the game select page
    await expect(page.locator('h2:has-text("Choose Your Game")')).toBeVisible()
    
    // Check that the form elements are present
    await expect(page.locator('label:has-text("Number of Players")')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
  })
}) 