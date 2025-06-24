// src/auth/auth0.ts
// Auth0 configuration and composable for authentication logic
// Documentation: https://auth0.com/docs/quickstart/spa/vuejs

import { createAuth0 } from '@auth0/auth0-vue'
import type { App } from 'vue'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

export function setupAuth0(app: App) {
  app.use(
    createAuth0({
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience,
      },
      cacheLocation: 'localstorage', // Recommended for SPA
    })
  )
}
