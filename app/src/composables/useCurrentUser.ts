// src/composables/useCurrentUser.ts
// Provides the current Auth0 user info in a composable way
import { useAuth0 } from '@auth0/auth0-vue'
import { computed } from 'vue'

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth0()
  // Return name/email if authenticated, else blank
  const name = computed(() => user.value?.name || user.value?.nickname || '')
  const email = computed(() => user.value?.email || '')
  return { name, email, isAuthenticated }
}
