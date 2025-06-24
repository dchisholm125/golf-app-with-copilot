import { ref } from 'vue'
import axios from 'axios'

const currentGameId = ref<number | null>(null)
const currentGameType = ref<string | null>(null)

async function fetchCurrentGameInfo(gameId: number) {
  try {
    const res = await axios.get(`/api/games/${gameId}/state`)
    if (res.data) {
      currentGameId.value = gameId
      currentGameType.value = res.data.game_type || null
    } else {
      currentGameId.value = null
      currentGameType.value = null
    }
  } catch (e) {
    currentGameId.value = null
    currentGameType.value = null
  }
}

function clearCurrentGame() {
  currentGameId.value = null
  currentGameType.value = null
}

export function useCurrentGameId() {
  return {
    currentGameId,
    currentGameType,
    setCurrentGameId: (id: number | null) => (currentGameId.value = id),
    setCurrentGameType: (type: string | null) => (currentGameType.value = type),
    fetchCurrentGameInfo,
    clearCurrentGame,
  }
}
