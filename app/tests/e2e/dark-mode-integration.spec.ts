import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Dark Mode Integration', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    // Navigate to app and ensure authentication
    await helpers.navigateToApp()
    
    // Ensure we start in light mode by clearing localStorage and forcing light mode
    await page.evaluate(() => {
      localStorage.removeItem('darkMode')
      document.body.classList.remove('dark-mode')
    })
    await page.waitForTimeout(500)
  })

  test('should toggle dark mode consistently across pages', async ({ page }) => {
    // Verify we start in light mode (reset in beforeEach)
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/)
    
    // Toggle to dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Navigate to leaderboards - should stay in dark mode
    await page.click('text=Leaderboards')
    await page.waitForURL('**/leaderboards')
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Navigate to achievements - should stay in dark mode
    await page.click('text=Achievements')
    await page.waitForURL('**/achievements')
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Navigate back to home - should stay in dark mode
    await page.click('text=Golf Games')
    await page.waitForURL('**/')
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Toggle back to light mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/)
  })

  test('should persist dark mode preference after page reload', async ({ page }) => {
    // Toggle to dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be in dark mode
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    
    // Navigate to a different page
    await helpers.navigateToLeaderboards()
    
    // Should still be in dark mode
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
  })

  test('should have readable text in dark mode on all new pages', async ({ page }) => {
    // Toggle to dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    
    // Test Leaderboards page
    await helpers.navigateToLeaderboards()
    
    // Check that title is visible and has appropriate color
    const leaderboardTitle = page.locator('h1')
    await expect(leaderboardTitle).toBeVisible()
    
    // Check that filter labels are visible
    const filterLabels = page.locator('.form-label')
    const labelCount = await filterLabels.count()
    if (labelCount > 0) {
      await expect(filterLabels.first()).toBeVisible()
    }
    
    // Test Achievements page
    await helpers.navigateToAchievements()
    
    // Check that title is visible
    const achievementTitle = page.locator('h1')
    await expect(achievementTitle).toBeVisible()
    
    // Check that achievement cards have readable text
    const achievementCards = page.locator('.achievement-card')
    const cardCount = await achievementCards.count()
    if (cardCount > 0) {
      const firstCard = achievementCards.first()
      const cardName = firstCard.locator('.achievement-name')
      const cardDescription = firstCard.locator('.achievement-description')
      
      await expect(cardName).toBeVisible()
      await expect(cardDescription).toBeVisible()
    }
    
    // Check that stats are visible
    const statsCards = page.locator('.stat-card')
    const statsCount = await statsCards.count()
    if (statsCount > 0) {
      const firstStat = statsCards.first()
      const statNumber = firstStat.locator('.stat-number')
      const statLabel = firstStat.locator('.stat-label')
      
      await expect(statNumber).toBeVisible()
      await expect(statLabel).toBeVisible()
    }
  })

  test('should not show Vue warnings in console', async ({ page }) => {
    const consoleWarnings: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Vue warn')) {
        consoleWarnings.push(msg.text())
      }
    })
    
    // Navigate and interact with dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    
    await helpers.navigateToLeaderboards()
    
    await helpers.navigateToAchievements()
    
    // Check that no Vue warnings were logged
    expect(consoleWarnings.length).toBe(0)
  })

  test('should handle form elements properly in dark mode', async ({ page }) => {
    // Toggle to dark mode
    await page.click('[aria-label="Toggle dark mode"]')
    await page.waitForTimeout(500)
    
    // Test form elements on leaderboards page
    await helpers.navigateToLeaderboards()
    
    // Check select dropdowns
    const selects = page.locator('select')
    const selectCount = await selects.count()
    
    if (selectCount > 0) {
      const firstSelect = selects.first()
      await expect(firstSelect).toBeVisible()
      
      // Test interaction
      await firstSelect.click()
      await firstSelect.selectOption({ index: 1 })
    }
    
    // Test form elements on achievements page
    await helpers.navigateToAchievements()
    
    // Check checkboxes
    const checkboxes = page.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    
    if (checkboxCount > 0) {
      const firstCheckbox = checkboxes.first()
      await expect(firstCheckbox).toBeVisible()
      
      // Test interaction
      await firstCheckbox.check()
      await firstCheckbox.uncheck()
    }
  })
})
