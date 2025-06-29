import { test, expect } from '@playwright/test';

// This test covers the New Round to Post-Round Entry flow for 9 holes

test.describe('Post-Round Entry Flow', () => {
  test('User can start a new round and complete post-round entry for 9 holes', async ({ page }) => {
    // Go to New Round page
    await page.goto('/new-round');

    // Select a course
    await page.fill('#course', 'Pebble Beach');
    await page.waitForSelector('.autocomplete-list, .dropdown-menu');
    await page.click('.dropdown-item');

    // Select 9 holes
    await page.selectOption('#holes', '9');

    // Select a tee
    await page.selectOption('#tee', 'Blue');

    // Set a date (today)
    await page.fill('#date', '2025-06-28');

    // Click Enter Post-Round
    await page.click('button:has-text("Enter Post-Round")');

    // Should be on PostRoundEntry for 9 holes
    for (let i = 1; i <= 9; i++) {
      await expect(page.locator('h4')).toContainText(`Hole ${i}`);
      // For par 4/5, hit fairway; for par 3, skip fairway
      const par = i % 3 === 2 ? 3 : (i % 2 === 0 ? 4 : 5);
      if (par >= 4) {
        await page.click('button:has-text("Hit")'); // Fairway
      }
      await page.click('button:has-text("Hit")'); // GIR
      await page.fill('input[placeholder="Putts"], input[type="number"]', '2');
      await page.click('button:has-text("Next"), button:has-text("Finish")');
    }
    // Should see completion message
    await expect(page.locator('h4')).toContainText('All holes complete');
  });
});
