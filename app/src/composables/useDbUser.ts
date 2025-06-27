import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'

const dbUser = ref<any>(null)
const loading = ref(false)
const error = ref<any>(null)

export function useDbUser() {
  const { user, isAuthenticated } = useAuth0()

  async function fetchDbUser() {
    if (isAuthenticated.value && user.value?.sub) {
      loading.value = true
      try {
        const res = await axios.get(`/users/by-auth0/${encodeURIComponent(user.value.sub)}`)
        dbUser.value = res.data
      } catch (e) {
        error.value = e
      } finally {
        loading.value = false
      }
    }
  }

  return { dbUser, fetchDbUser, loading, error }
}
