import { ref } from 'vue'

const currentGameId = ref<number | null>(null)

export function useCurrentGameId() {
  return {
    currentGameId,
    setCurrentGameId: (id: number | null) => (currentGameId.value = id),
  }
}
