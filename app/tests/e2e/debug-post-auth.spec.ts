import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test('debug post-authentication page', async ({ page }) => {
  const testHelpers = new TestHelpers(page)
  
  // Navigate to game select - this should trigger authentication if needed
  await testHelpers.navigateToGameSelect()
  
  console.log('Post-auth URL:', page.url())
  console.log('Post-auth title:', await page.title())
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-post-auth.png' })
  
  // Check what elements are visible
  const allElements = await page.locator('*').all()
  console.log(`Found ${allElements.length} elements on page`)
  
  // Check for common elements
  const h1Elements = await page.locator('h1').all()
  console.log(`Found ${h1Elements.length} h1 elements`)
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent()
    console.log(`H1 ${i + 1}:`, text?.trim())
  }
  
  const selectElements = await page.locator('select').all()
  console.log(`Found ${selectElements.length} select elements`)
  
  const buttonElements = await page.locator('button').all()
  console.log(`Found ${buttonElements.length} button elements`)
  for (let i = 0; i < Math.min(buttonElements.length, 5); i++) {
    const text = await buttonElements[i].textContent()
    console.log(`Button ${i + 1}:`, text?.trim())
  }
  
  // Check if we're authenticated
  const isAuthenticated = await testHelpers.isAuthenticated()
  console.log('Is authenticated:', isAuthenticated)
}) 