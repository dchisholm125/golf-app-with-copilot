import { ref, computed } from 'vue'
import { useGameState, type Player } from './useGameState'
import { useNavigation } from '../services/navigationService'
import { useGameManagement } from '../services/gameManagementService'

export interface SkinsGameState {
  skinValue: number
  scores: Record<string, number[]>
  skins: Array<{
    hole: number
    winner: string | null
    value: number
  }>
  gameStarted: boolean
}

export function useSkinsGameLogic() {
  const {
    loading,
    error,
    gameState,
    gameId,
    currentHole,
    totalHoles,
    players,
    isComplete,
    gameType,
    loadState,
    saveState,
    updatePlayerScore,
    advanceHole,
  } = useGameState()
  
  const navigation = useNavigation()
  const gameManagement = useGameManagement()
  
  // Skins-specific state
  const skinsState = ref<SkinsGameState>({
    skinValue: 0,
    scores: {},
    skins: [],
    gameStarted: false,
  })
  
  // Computed properties
  const playerScores = computed(() => {
    const scores: Record<string, number[]> = {}
    players.value.forEach(player => {
      scores[player.email] = player.scores
    })
    return scores
  })
  
  const skinsResults = computed(() => {
    return calculateSkins(playerScores.value, skinsState.value.skinValue)
  })
  
  const playerTotals = computed(() => {
    const totals: Record<string, { skins: number; winnings: number }> = {}
    
    skinsResults.value.forEach(skin => {
      if (skin.winner) {
        if (!totals[skin.winner]) {
          totals[skin.winner] = { skins: 0, winnings: 0 }
        }
        totals[skin.winner].skins++
        totals[skin.winner].winnings += skin.value
      }
    })
    
    return totals
  })
  
  // Actions
  function startGame(skinValue: number) {
    skinsState.value = {
      skinValue,
      scores: {},
      skins: [],
      gameStarted: true,
    }
    
    // Initialize scores for all players
    players.value.forEach(player => {
      skinsState.value.scores[player.email] = Array(totalHoles.value).fill(0)
    })
    
    saveSkinsState()
  }
  
  function updateScore(playerEmail: string, holeIndex: number, score: number) {
    if (!skinsState.value.scores[playerEmail]) {
      skinsState.value.scores[playerEmail] = Array(totalHoles.value).fill(0)
    }
    skinsState.value.scores[playerEmail][holeIndex] = score
    
    // Update the player's score in the main state
    const playerIndex = players.value.findIndex(p => p.email === playerEmail)
    if (playerIndex !== -1) {
      updatePlayerScore(playerIndex, holeIndex, score)
    }
  }
  
  function submitHole() {
    // Calculate skins for the current hole
    const currentHoleScores: Record<string, number> = {}
    players.value.forEach(player => {
      currentHoleScores[player.email] = player.scores[currentHole.value] || 0
    })
    
    const minScore = Math.min(...Object.values(currentHoleScores))
    const winners = Object.entries(currentHoleScores)
      .filter(([_, score]) => score === minScore)
      .map(([email, _]) => email)
    
    const carryover = skinsState.value.skins.filter(s => s.winner === null).length
    
    if (winners.length === 1) {
      // Single winner - award the skin
      skinsState.value.skins.push({
        hole: currentHole.value + 1,
        winner: winners[0],
        value: skinsState.value.skinValue * (carryover + 1)
      })
    } else {
      // Tie - carry over to next hole
      skinsState.value.skins.push({
        hole: currentHole.value + 1,
        winner: null,
        value: 0
      })
    }
    
    // Advance to next hole
    if (currentHole.value < totalHoles.value - 1) {
      advanceHole()
    } else {
      advanceHole() // This will mark the game as complete
    }
    
    saveSkinsState()
  }
  
  function calculateSkins(scores: Record<string, number[]>, skinValue: number) {
    const skins: Array<{ hole: number; winner: string | null; value: number }> = []
    let carryover = 0
    
    const numHoles = Math.max(...Object.values(scores).map(s => s.length))
    
    for (let h = 0; h < numHoles; h++) {
      const holeScores: Record<string, number> = {}
      Object.entries(scores).forEach(([email, playerScores]) => {
        holeScores[email] = playerScores[h] || 0
      })
      
      const minScore = Math.min(...Object.values(holeScores))
      const winners = Object.entries(holeScores)
        .filter(([_, score]) => score === minScore)
        .map(([email, _]) => email)
      
      if (winners.length === 1) {
        skins.push({
          hole: h + 1,
          winner: winners[0],
          value: skinValue * (carryover + 1)
        })
        carryover = 0
      } else {
        skins.push({
          hole: h + 1,
          winner: null,
          value: 0
        })
        carryover++
      }
    }
    
    return skins
  }
  
  async function saveSkinsState() {
    await saveState({
      skinValue: skinsState.value.skinValue,
      scores: skinsState.value.scores,
      skins: skinsState.value.skins,
      gameStarted: skinsState.value.gameStarted,
    })
  }
  
  async function loadSkinsState() {
    await loadState()
    
    // Load Skins-specific state from state_json
    if (gameState.value) {
      const stateJson = gameState.value as any
      skinsState.value = {
        skinValue: stateJson.skinValue || 0,
        scores: stateJson.scores || {},
        skins: stateJson.skins || [],
        gameStarted: stateJson.gameStarted !== false,
      }
    }
  }
  
  function completeGame() {
    if (gameId.value) {
      gameManagement.markGameComplete(gameId.value)
      navigation.goToGameComplete('skins', gameId.value)
    }
  }
  
  return {
    // Inherited from useGameState
    loading,
    error,
    gameId,
    currentHole,
    totalHoles,
    players,
    isComplete,
    gameType,
    
    // Skins-specific state
    skinsState,
    playerScores,
    skinsResults,
    playerTotals,
    
    // Actions
    loadSkinsState,
    startGame,
    updateScore,
    submitHole,
    completeGame,
  }
} 