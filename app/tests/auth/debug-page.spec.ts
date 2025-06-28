import { test } from '@playwright/test'

test.describe('Debug Page', () => {
  test('should debug what is on the page', async ({ page }) => {
    console.log('Navigating to app...')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log('Current URL:', page.url())
    console.log('Page title:', await page.title())
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-page.png' })
    
    // Check for common elements
    const elements = [
      'text=Login',
      'text=Welcome',
      'text=Golf',
      '[data-testid="login-button"]',
      'button:has-text("Login")',
      'a:has-text("Login")',
      '.login-button',
      '.auth-button'
    ]
    
    for (const selector of elements) {
      const element = page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)
      console.log(`${selector}: ${isVisible}`)
    }
    
    // Check if we're already on Auth0
    const isAuth0Page = page.url().includes('auth0.com')
    console.log('Is Auth0 page:', isAuth0Page)
    
    // Get page content
    const pageText = await page.textContent('body')
    console.log('Page text length:', pageText?.length || 0)
    console.log('First 500 characters:', pageText?.substring(0, 500))
  })
}) 