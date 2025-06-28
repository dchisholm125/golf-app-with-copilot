import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { loadGameState, saveGameState } from '../services/gameStateService'
import { getPlayersForGame } from '../services/gameService'

export interface Player {
  name: string
  email: string
  scores: number[]
}

export interface GameState {
  currentHole: number
  totalHoles: number
  players: Player[]
  isComplete: boolean
  gameType: string
}

export function useGameState() {
  const route = useRoute()
  const gameId = computed(() => Number(route.params.gameId))
  
  // Core state
  const loading = ref(true)
  const error = ref<string | null>(null)
  const gameState = ref<GameState | null>(null)
  
  // Computed properties
  const currentHole = computed(() => gameState.value?.currentHole ?? 0)
  const totalHoles = computed(() => gameState.value?.totalHoles ?? 18)
  const players = computed(() => gameState.value?.players ?? [])
  const isComplete = computed(() => gameState.value?.isComplete ?? false)
  const gameType = computed(() => gameState.value?.gameType ?? '')
  
  // Actions
  async function loadState() {
    if (!gameId.value) {
      error.value = 'No game ID found in route.'
      loading.value = false
      return
    }
    
    try {
      loading.value = true
      error.value = null
      
      const state = await loadGameState(gameId.value)
      if (!state || !state.state_json) {
        error.value = 'Game not found.'
        return
      }
      
      // Fetch players from backend
      let playerList = []
      try {
        playerList = await getPlayersForGame(gameId.value)
      } catch (err) {
        playerList = state.state_json.players || []
      }
      
      // Merge backend player info with scores from state
      const statePlayers = Array.isArray(state.state_json.players) ? state.state_json.players : []
      const mergedPlayers = Array.isArray(playerList) && playerList.length 
        ? playerList.map((p: any) => {
            const match = statePlayers.find((sp: any) => sp.name === p.name || sp.email === p.email)
            return {
              name: p.name,
              email: p.email,
              scores: match && Array.isArray(match.scores) ? match.scores : Array(totalHoles.value).fill(0),
            }
          })
        : statePlayers.map((p: any) => ({
            name: p.name,
            email: p.email || '',
            scores: Array.isArray(p.scores) ? p.scores : Array(totalHoles.value).fill(0),
          }))
      
      gameState.value = {
        currentHole: typeof state.state_json.currentHole === 'number' ? state.state_json.currentHole : 0,
        totalHoles: state.num_holes || 18,
        players: mergedPlayers,
        isComplete: state.state_json.isComplete || false,
        gameType: state.state_json.gameType || '',
      }
      
    } catch (e) {
      error.value = 'Failed to load game state.'
      console.error('Error loading game state:', e)
    } finally {
      loading.value = false
    }
  }
  
  async function saveState(additionalState: Record<string, any> = {}) {
    if (!gameId.value || !gameState.value) return
    
    try {
      const stateToSave = {
        current_hole: gameState.value.currentHole,
        state_json: {
          players: gameState.value.players,
          currentHole: gameState.value.currentHole,
          numHoles: gameState.value.totalHoles,
          ...additionalState
        }
      }
      
      await saveGameState(gameId.value, stateToSave)
    } catch (e) {
      error.value = 'Failed to save game state.'
      console.error('Error saving game state:', e)
    }
  }
  
  function updatePlayerScore(playerIndex: number, holeIndex: number, score: number) {
    if (!gameState.value || !gameState.value.players[playerIndex]) return
    
    gameState.value.players[playerIndex].scores[holeIndex] = score
  }
  
  function advanceHole() {
    if (!gameState.value) return
    
    gameState.value.currentHole++
    if (gameState.value.currentHole >= gameState.value.totalHoles) {
      gameState.value.isComplete = true
    }
  }
  
  return {
    // State
    loading,
    error,
    gameState,
    
    // Computed
    gameId,
    currentHole,
    totalHoles,
    players,
    isComplete,
    gameType,
    
    // Actions
    loadState,
    saveState,
    updatePlayerScore,
    advanceHole,
  }
} 