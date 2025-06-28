import { test } from '@playwright/test'

test.describe('Debug Game Select', () => {
  test('should debug the game select page', async ({ page }) => {
    // Navigate to the app (should be authenticated)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('Current URL:', page.url())
    console.log('Page title:', await page.title())
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-home.png' })
    
    // Try to navigate to game select
    console.log('Attempting to navigate to game select...')
    
    // Look for navigation elements
    const navElements = [
      'text=New Game',
      'text=Create Game',
      'text=Start Game',
      'a:has-text("New Game")',
      'button:has-text("New Game")',
      '[data-testid="new-game"]',
      '[data-testid="create-game"]'
    ]
    
    for (const selector of navElements) {
      const element = page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)
      console.log(`${selector}: ${isVisible}`)
    }
    
    // Try clicking on New Game if found
    const newGameSelectors = [
      'text=New Game',
      'text=Start New Game',
      'a:has-text("New Game")',
      'a:has-text("Start New Game")',
      'button:has-text("New Game")',
      'button:has-text("Start New Game")',
      '[data-testid="new-game"]',
      '[data-testid="create-game"]',
      'a, button' // Try any link or button
    ]
    
    let newGameButton: any = null
    for (const selector of newGameSelectors) {
      const element = page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)
      console.log(`${selector}: ${isVisible}`)
      
      if (isVisible && !newGameButton) {
        newGameButton = element
        console.log(`Found New Game button with selector: ${selector}`)
      }
    }
    
    if (newGameButton) {
      console.log('Found New Game button - clicking it')
      await newGameButton.click()
      await page.waitForLoadState('networkidle')
      
      console.log('After clicking New Game - URL:', page.url())
      console.log('After clicking New Game - title:', await page.title())
      
      // Take another screenshot
      await page.screenshot({ path: 'debug-game-select.png' })
      
      // Look for form elements
      const formElements = [
        'select:has-text("Number of Players")',
        'select:has-text("Game Type")',
        'select:has-text("Number of Holes")',
        'input[placeholder*="Player 1"]',
        'input[placeholder*="Player 2"]',
        'input[placeholder*="Player 3"]',
        'input[placeholder*="Player 4"]',
        'button:has-text("Start Game")',
        'button:has-text("Create Game")'
      ]
      
      for (const selector of formElements) {
        const element = page.locator(selector)
        const isVisible = await element.isVisible().catch(() => false)
        console.log(`${selector}: ${isVisible}`)
        
        if (isVisible) {
          // Get more details about the element
          const tagName = await element.evaluate(el => el.tagName).catch(() => 'unknown')
          const type = await element.getAttribute('type').catch(() => 'none')
          const placeholder = await element.getAttribute('placeholder').catch(() => 'none')
          console.log(`  - Tag: ${tagName}, Type: ${type}, Placeholder: ${placeholder}`)
        }
      }
      
      // Look for ALL select elements
      const allSelects = await page.locator('select').count()
      console.log(`Total select elements on page: ${allSelects}`)
      
      for (let i = 0; i < allSelects; i++) {
        const select = page.locator('select').nth(i)
        const text = await select.textContent().catch(() => 'no text')
        const options = await select.locator('option').count()
        console.log(`Select ${i}: text="${text}", options=${options}`)
      }
      
      // Look for ALL input elements
      const allInputs = await page.locator('input').count()
      console.log(`Total input elements on page: ${allInputs}`)
      
      for (let i = 0; i < allInputs; i++) {
        const input = page.locator('input').nth(i)
        const type = await input.getAttribute('type').catch(() => 'no type')
        const placeholder = await input.getAttribute('placeholder').catch(() => 'no placeholder')
        const name = await input.getAttribute('name').catch(() => 'no name')
        console.log(`Input ${i}: type="${type}", placeholder="${placeholder}", name="${name}"`)
      }
      
      // Look for ALL buttons
      const allButtons = await page.locator('button').count()
      console.log(`Total button elements on page: ${allButtons}`)
      
      for (let i = 0; i < allButtons; i++) {
        const button = page.locator('button').nth(i)
        const text = await button.textContent().catch(() => 'no text')
        console.log(`Button ${i}: text="${text}"`)
      }
    } else {
      console.log('No New Game button found')
      
      // Check what's on the current page
      const pageText = await page.textContent('body')
      console.log('Page text length:', pageText?.length || 0)
      console.log('First 1000 characters:', pageText?.substring(0, 1000))
    }
  })
}) 