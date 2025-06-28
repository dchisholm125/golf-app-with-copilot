import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  // Add any global cleanup here
  // For example, cleaning up test data, resetting database state, etc.
  
  console.log('Global teardown completed')
}

export default globalTeardown 