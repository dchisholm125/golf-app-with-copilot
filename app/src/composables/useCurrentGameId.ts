import { ref } from 'vue'
import { API_BASE_URL } from '../config'
import axios from 'axios'

const currentGameId = ref<number | null>(null)
const currentGameType = ref<string | null>(null)

// Restore from localStorage on load
const savedId = localStorage.getItem('currentGameId')
if (savedId) {
  currentGameId.value = parseInt(savedId, 10)
}

async function fetchCurrentGameInfo(gameId: number) {
  try {
    const res = await axios.get(`${API_BASE_URL}/games/${gameId}/state`)
    if (res.data) {
      currentGameId.value = gameId
      currentGameType.value = res.data.game_type || null
      // Persist to localStorage
      localStorage.setItem('currentGameId', gameId.toString())
    } else {
      currentGameId.value = null
      currentGameType.value = null
      localStorage.removeItem('currentGameId')
    }
  } catch (e) {
    currentGameId.value = null
    currentGameType.value = null
    localStorage.removeItem('currentGameId')
  }
}

function clearCurrentGame() {
  currentGameId.value = null
  currentGameType.value = null
  localStorage.removeItem('currentGameId')
}

export function useCurrentGameId() {
  return {
    currentGameId,
    currentGameType,
    setCurrentGameId: (id: number | null) => {
      currentGameId.value = id
      if (id !== null) {
        localStorage.setItem('currentGameId', id.toString())
      } else {
        localStorage.removeItem('currentGameId')
      }
    },
    setCurrentGameType: (type: string | null) => (currentGameType.value = type),
    fetchCurrentGameInfo,
    clearCurrentGame,
  }
}
