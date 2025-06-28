import { Page, expect } from '@playwright/test'

export interface TestPlayer {
  name: string
  email: string
}

export interface GameSetupOptions {
  gameType: 'wolf' | 'skins'
  players: TestPlayer[]
  skinValue?: number
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the app and wait for it to load
   */
  async navigateToApp() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
    
    // Check if we need to authenticate
    await this.ensureAuthenticated()
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.page.locator('[data-testid="user-avatar"]').isVisible()
  }

  /**
   * Handle Auth0 authentication if needed
   */
  async ensureAuthenticated() {
    // Check if we're already authenticated
    if (await this.isAuthenticated()) {
      return true
    }

    // Check if we're on an Auth0 login page or our app's login page
    const currentUrl = this.page.url()
    const isOnAuth0Page = currentUrl.includes('auth0.com') || 
                         currentUrl.includes('login') ||
                         await this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').isVisible().catch(() => false)

    if (isOnAuth0Page) {
      console.log('Detected login page - attempting authentication')
      console.log('Current URL:', currentUrl)
      
      try {
        // Take a screenshot for debugging
        await this.takeScreenshot('auth-page-detected')
        
        // Wait a bit for the page to fully load
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForTimeout(2000)
        
        // Try multiple selectors for email input
        const emailSelectors = [
          'input[type="email"]',
          'input[name="email"]',
          'input[name="username"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]',
          'input[data-testid*="email"]',
          'input[id*="email"]',
          'input[id="username"]'
        ]
        
        let emailInput: any = null
        for (const selector of emailSelectors) {
          try {
            const element = this.page.locator(selector)
            if (await element.isVisible({ timeout: 2000 })) {
              emailInput = element
              console.log(`Found email input with selector: ${selector}`)
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!emailInput) {
          console.log('No email input found, checking page content...')
          const pageContent = await this.page.content()
          console.log('Page title:', await this.page.title())
          console.log('Page URL:', this.page.url())
          
          // Take another screenshot
          await this.takeScreenshot('no-email-input-found')
          
          // If we can't find the login form, maybe we're already authenticated
          // or on a different page
          if (await this.isAuthenticated()) {
            console.log('User appears to be authenticated despite being on login page')
            return true
          }
          
          throw new Error('Could not find email input field on login page')
        }
        
        // Try multiple selectors for password input
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          'input[placeholder*="password"]',
          'input[placeholder*="Password"]',
          'input[data-testid*="password"]',
          'input[id*="password"]'
        ]
        
        let passwordInput: any = null
        for (const selector of passwordSelectors) {
          try {
            const element = this.page.locator(selector)
            if (await element.isVisible({ timeout: 2000 })) {
              passwordInput = element
              console.log(`Found password input with selector: ${selector}`)
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!passwordInput) {
          throw new Error('Could not find password input field on login page')
        }
        
        // Try multiple selectors for login button
        const loginButtonSelectors = [
          'button[type="submit"]',
          'button:has-text("Login")',
          'button:has-text("Sign In")',
          'button:has-text("Continue")',
          'button:has-text("Log in")',
          'input[type="submit"]'
        ]
        
        let loginButton: any = null
        for (const selector of loginButtonSelectors) {
          try {
            const element = this.page.locator(selector)
            if (await element.isVisible({ timeout: 2000 })) {
              loginButton = element
              console.log(`Found login button with selector: ${selector}`)
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!loginButton) {
          throw new Error('Could not find login button on login page')
        }
        
        // Fill in test credentials
        const testEmail = 'dev@dev.dev'
        const testPassword = 'DEVdev1!'
        
        console.log(`Logging in with test user: ${testEmail}`)
        
        // Clear and fill email
        await emailInput.clear()
        await emailInput.fill(testEmail)
        
        // Clear and fill password
        await passwordInput.clear()
        await passwordInput.fill(testPassword)
        
        // Submit the form
        await loginButton.click()
        
        // Wait for redirect and handle consent screen
        await this.page.waitForLoadState('networkidle')
        await this.page.waitForTimeout(3000)
        
        // Check for consent screen
        const acceptButton = this.page.locator('button:has-text("Accept"), button:has-text("Allow"), [data-action="allow"]')
        if (await acceptButton.isVisible({ timeout: 5000 })) {
          console.log('Found consent screen - clicking Accept')
          await acceptButton.click()
          await this.page.waitForLoadState('networkidle')
          await this.page.waitForTimeout(3000)
        }
        
        // Wait for redirect back to the app
        await this.page.waitForURL(/localhost.*/, { timeout: 30000 })
        
        // Verify authentication succeeded
        if (await this.isAuthenticated()) {
          console.log('Authentication successful')
          return true
        } else {
          console.log('Authentication may have failed - user avatar not visible')
          await this.takeScreenshot('auth-failed')
          return false
        }
        
      } catch (error) {
        console.error('Authentication failed:', error)
        await this.takeScreenshot('auth-error')
        return false
      }
    }
    
    return false
  }

  /**
   * Navigate to game selection page
   */
  async navigateToGameSelect() {
    await this.page.goto('/game-select')
    await this.page.waitForLoadState('networkidle')
    
    // Check if we need to authenticate
    await this.ensureAuthenticated()
    
    // After authentication, we might be redirected to home page
    // Check if we're on the home page and need to click "Start New Game"
    const startNewGameButton = this.page.locator('button:has-text("Start New Game")')
    if (await startNewGameButton.isVisible()) {
      console.log('Redirected to home page after auth, clicking Start New Game')
      await startNewGameButton.click()
      await this.page.waitForLoadState('networkidle')
      await this.page.waitForURL(/\/game-select/, { timeout: 10000 })
    }
  }

  /**
   * Create a new game with the specified options
   */
  async createGame(options: GameSetupOptions) {
    await this.navigateToGameSelect()

    // Set number of players (first select element)
    await this.page.selectOption('select >> nth=0', options.players.length.toString())

    // Fill in player information
    for (let i = 0; i < options.players.length; i++) {
      const player = options.players[i]
      await this.page.fill(`input[placeholder*="Player ${i + 1} Name"]`, player.name)
      await this.page.fill(`input[placeholder*="Player ${i + 1} Email"]`, player.email)
    }

    // Select number of holes (second select element - default to 9 holes)
    await this.page.selectOption('select >> nth=1', '9 Holes')

    // Select game type (third select element)
    await this.page.selectOption('select >> nth=2', options.gameType)

    // Set skin value for Skins games
    if (options.gameType === 'skins' && options.skinValue) {
      await this.page.fill('input[placeholder*="skin value"]', options.skinValue.toString())
    }

    // Start the game
    await this.page.click('button:has-text("Start Game")')

    // Wait for navigation to game page
    if (options.gameType === 'wolf') {
      await this.page.waitForURL(/\/wolf\/\d+/)
    } else if (options.gameType === 'skins') {
      await this.page.waitForURL(/\/skins\/\d+/)
    }
  }

  /**
   * Get the current game ID from the URL
   */
  async getCurrentGameId(): Promise<number> {
    const url = this.page.url()
    const match = url.match(/\/(wolf|skins)\/(\d+)/)
    return match ? parseInt(match[2]) : 0
  }

  /**
   * Wait for a game to load
   */
  async waitForGameLoad() {
    await this.page.waitForSelector('[data-testid="game-content"]', { timeout: 10000 })
  }

  /**
   * Start a Wolf game
   */
  async startWolfGame() {
    const startButton = this.page.locator('button:has-text("Start Wolf Game")')
    if (await startButton.isVisible()) {
      await startButton.click()
      await this.page.waitForSelector('[data-testid="wolf-game-started"]')
    }
  }

  /**
   * Start a Skins game
   */
  async startSkinsGame(skinValue: number) {
    await this.page.fill('input[placeholder*="skin value"]', skinValue.toString())
    await this.page.click('button:has-text("Start Skins Game")')
    await this.page.waitForSelector('[data-testid="skins-game-started"]')
  }

  /**
   * Submit scores for a hole in Skins game
   */
  async submitSkinsScores(scores: Record<string, number>) {
    for (const [playerName, score] of Object.entries(scores)) {
      await this.page.fill(`input[placeholder="Score"]:near(:text("${playerName}"))`, score.toString())
    }
    await this.page.click('button:has-text("Submit Hole")')
  }

  /**
   * Complete a Wolf game hole
   */
  async completeWolfHole(partnerName?: string, holeWinner?: string) {
    if (partnerName) {
      await this.page.click(`button:has-text("${partnerName}")`)
    } else {
      await this.page.click('button:has-text("Go Lone Wolf")')
    }

    if (holeWinner) {
      await this.page.click(`button:has-text("${holeWinner}")`)
    }

    await this.page.click('button:has-text("Submit Hole")')
  }

  /**
   * Navigate to game history
   */
  async navigateToGameHistory() {
    await this.page.click('button:has-text("History")')
    await this.page.waitForURL('/history')
  }

  /**
   * Navigate to profile
   */
  async navigateToProfile() {
    await this.page.click('button:has-text("Profile")')
    await this.page.waitForURL('/')
  }

  /**
   * Navigate to leaderboards
   */
  async navigateToLeaderboards() {
    await this.page.click('text=Leaderboards')
    await this.page.waitForURL('**/leaderboards')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Navigate to achievements
   */
  async navigateToAchievements() {
    await this.page.click('text=Achievements')
    await this.page.waitForURL('**/achievements')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Logout from the application
   */
  async logout() {
    await this.page.click('[data-testid="user-avatar"]')
    await this.page.click('button:has-text("Logout")')
    
    // Auth0 logout redirects to Auth0 login page, not our app's login page
    // Wait for either Auth0 login page or our app's login page
    await this.page.waitForURL(/.*(auth0\.com.*login|localhost.*login).*/, { timeout: 10000 })
    
    // Verify localStorage is cleared
    const localStorageItems = await this.page.evaluate(() => {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items[key] = localStorage.getItem(key) || ''
        }
      }
      return items
    })
    
    // Check that Auth0 and game state are cleared
    const hasAuth0Data = Object.keys(localStorageItems).some(key => 
      key.includes('@@auth0spajs@@') || key.includes('auth0') || key.includes('Auth0')
    )
    const hasCurrentGameId = Object.keys(localStorageItems).some(key => key === 'currentGameId')
    
    if (hasAuth0Data || hasCurrentGameId) {
      console.warn('localStorage may not be fully cleared after logout:', Object.keys(localStorageItems))
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` })
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string) {
    await this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200
    )
  }

  /**
   * Mock API responses for testing
   */
  async mockAPIResponse(urlPattern: string, responseData: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      })
    })
  }
}

/**
 * Create test data for players
 */
export function createTestPlayers(count: number): TestPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test Player ${i + 1}`,
    email: `testplayer${i + 1}@example.com`
  }))
}

/**
 * Assert that an element is visible and contains text
 */
export async function expectElementWithText(page: Page, selector: string, text: string) {
  await expect(page.locator(selector)).toBeVisible()
  await expect(page.locator(selector)).toContainText(text)
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  await page.waitForSelector('.spinner-border', { state: 'hidden', timeout: 10000 })
}