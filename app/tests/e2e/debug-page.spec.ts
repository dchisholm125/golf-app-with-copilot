import { test, expect } from '@playwright/test'

test.describe('Debug Page Content', () => {
  test('should debug what is on the game select page', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'debug-home.png' })
    
    // Log the page title
    console.log('Page title:', await page.title())
    
    // Log all text content
    const textContent = await page.textContent('body')
    console.log('Page text content:', textContent)
    
    // Navigate to game select
    await page.goto('/game-select')
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot of the game select page
    await page.screenshot({ path: 'debug-game-select.png' })
    
    // Log the page title
    console.log('Game select page title:', await page.title())
    
    // Log all text content
    const gameSelectTextContent = await page.textContent('body')
    console.log('Game select page text content:', gameSelectTextContent)
    
    // Check if there are any h1, h2, h3 elements
    const headings = await page.locator('h1, h2, h3').allTextContents()
    console.log('Headings found:', headings)
    
    // Check if there are any select elements
    const selectCount = await page.locator('select').count()
    console.log('Number of select elements:', selectCount)
  })
}) 