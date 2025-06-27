import { test, expect } from '@playwright/test'

test('debug Auth0 login page structure', async ({ page }) => {
  // Navigate to the app to trigger Auth0 redirect
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  
  // Wait a bit for any redirects
  await page.waitForTimeout(3000)
  
  console.log('Current URL:', page.url())
  console.log('Page title:', await page.title())
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-auth0-page.png' })
  
  // Check if we're on an Auth0 page
  if (page.url().includes('auth0.com')) {
    console.log('On Auth0 page, inspecting structure...')
    
    // Get all input elements
    const inputs = await page.locator('input').all()
    console.log(`Found ${inputs.length} input elements`)
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const id = await input.getAttribute('id')
      const placeholder = await input.getAttribute('placeholder')
      const dataTestId = await input.getAttribute('data-testid')
      
      console.log(`Input ${i + 1}:`, {
        type,
        name,
        id,
        placeholder,
        dataTestId,
        visible: await input.isVisible()
      })
    }
    
    // Get all button elements
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} button elements`)
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      
      console.log(`Button ${i + 1}:`, {
        text: text?.trim(),
        type,
        visible: await button.isVisible()
      })
    }
    
    // Get page HTML for inspection
    const html = await page.content()
    console.log('Page HTML (first 1000 chars):', html.substring(0, 1000))
    
  } else {
    console.log('Not on Auth0 page, current page:', page.url())
  }
}) 