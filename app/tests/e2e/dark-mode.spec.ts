import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Dark Mode', () => {
  let testHelpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    testHelpers = new TestHelpers(page)
    await testHelpers.navigateToApp()
  })

  test('should start in dark mode by default', async ({ page }) => {
    // Check that dark mode is applied by default
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveClass(/dark-mode/)
    
    // Check that the body also has dark mode class
    const bodyElement = page.locator('body')
    await expect(bodyElement).toHaveClass(/dark-mode/)
  })

  test('should toggle between light and dark mode', async ({ page }) => {
    // Find the dark mode toggle button
    const darkModeToggle = page.locator('.dark-mode-toggle')
    await expect(darkModeToggle).toBeVisible()
    
    // Check initial state (should be dark mode)
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveClass(/dark-mode/)
    
    // Click the toggle to switch to light mode
    await darkModeToggle.click()
    await page.waitForTimeout(500) // Wait for transition
    
    // Check that dark mode is removed
    await expect(htmlElement).not.toHaveClass(/dark-mode/)
    
    // Click again to switch back to dark mode
    await darkModeToggle.click()
    await page.waitForTimeout(500) // Wait for transition
    
    // Check that dark mode is applied again
    await expect(htmlElement).toHaveClass(/dark-mode/)
  })

  test('should show correct icon based on current mode', async ({ page }) => {
    // Find the dark mode toggle button
    const darkModeToggle = page.locator('.dark-mode-toggle')
    await expect(darkModeToggle).toBeVisible()
    
    // Check initial icon (should be sun in dark mode)
    const icon = darkModeToggle.locator('i')
    await expect(icon).toHaveClass(/bi-sun-fill/)
    
    // Click to switch to light mode
    await darkModeToggle.click()
    await page.waitForTimeout(500)
    
    // Check icon changed to moon
    await expect(icon).toHaveClass(/bi-moon-fill/)
    
    // Click to switch back to dark mode
    await darkModeToggle.click()
    await page.waitForTimeout(500)
    
    // Check icon changed back to sun
    await expect(icon).toHaveClass(/bi-sun-fill/)
  })

  test('should persist dark mode preference', async ({ page }) => {
    // Find the dark mode toggle button
    const darkModeToggle = page.locator('.dark-mode-toggle')
    await expect(darkModeToggle).toBeVisible()
    
    // Switch to light mode
    await darkModeToggle.click()
    await page.waitForTimeout(500)
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that light mode is still applied
    const htmlElement = page.locator('html')
    await expect(htmlElement).not.toHaveClass(/dark-mode/)
    
    // Switch back to dark mode
    await darkModeToggle.click()
    await page.waitForTimeout(500)
    
    // Reload again
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that dark mode is applied
    await expect(htmlElement).toHaveClass(/dark-mode/)
  })
}) 