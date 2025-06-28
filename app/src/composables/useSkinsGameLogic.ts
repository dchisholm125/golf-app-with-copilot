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
    const scores: Record<number, number[]> = {}
    players.value.forEach((player, idx) => {
      scores[idx] = player.scores
    })
    return scores
  })
  
  const skinsResults = computed(() => {
    return calculateSkins(playerScores.value, skinsState.value.skinValue)
  })
  
  const playerTotals = computed(() => {
    const totals: Record<number, { skins: number; winnings: number }> = {}
    
    skinsResults.value.forEach(skin => {
      if (typeof skin.winner === 'number') {
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
  // Change updateScore to use playerIndex
  function updateScore(playerIndex: number, holeIndex: number, score: number) {
    const player = players.value[playerIndex]
    if (!player) return
    // Update the player's score in the main state
    updatePlayerScore(playerIndex, holeIndex, score)
    // Also update skinsState.scores using index as key
    if (!skinsState.value.scores[playerIndex]) {
      skinsState.value.scores[playerIndex] = Array(totalHoles.value).fill(0)
    }
    skinsState.value.scores[playerIndex][holeIndex] = score
  }
  
  // Update startGame to initialize scores by index
  function startGame(skinValue: number) {
    skinsState.value = {
      skinValue,
      scores: {},
      skins: [],
      gameStarted: true,
    }
    players.value.forEach((player, idx) => {
      skinsState.value.scores[idx] = Array(totalHoles.value).fill(0)
    })
    saveSkinsState()
  }
  
  // Update calculateSkins to use index keys
  function calculateSkins(scores: Record<number, number[]>, skinValue: number) {
    const skins: Array<{ hole: number; winner: number | null; value: number }> = []
    let carryover = 0
    const numHoles = Math.max(...Object.values(scores).map(s => s.length))
    for (let h = 0; h < numHoles; h++) {
      const holeScores: Record<number, number> = {}
      let allScoresPresent = true
      Object.entries(scores).forEach(([idx, playerScores]) => {
        const score = playerScores[h]
        if (typeof score !== 'number' || score < 1) {
          allScoresPresent = false
        }
        holeScores[Number(idx)] = score || 0
      })
      if (!allScoresPresent) {
        skins.push({
          hole: h + 1,
          winner: null,
          value: 0
        })
        carryover++
        continue
      }
      const minScore = Math.min(...Object.values(holeScores))
      const winners = Object.entries(holeScores)
        .filter(([_, score]) => score === minScore)
        .map(([idx, _]) => Number(idx))
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
  
  // Update submitHole to use index keys
  function submitHole() {
    const currentHoleScores: Record<number, number> = {}
    let allScoresPresent = true
    players.value.forEach((player, idx) => {
      const score = player.scores[currentHole.value]
      if (typeof score !== 'number' || score < 1) {
        allScoresPresent = false
      }
      currentHoleScores[idx] = score || 0
    })
    if (!allScoresPresent) {
      alert('Please enter a valid score (>= 1) for all players before submitting.')
      return
    }
    const minScore = Math.min(...Object.values(currentHoleScores))
    const winners = Object.entries(currentHoleScores)
      .filter(([_, score]) => score === minScore)
      .map(([idx, _]) => Number(idx))
    const carryover = skinsState.value.skins.filter(s => s.winner === null).length
    if (winners.length === 1) {
      skinsState.value.skins.push({
        hole: currentHole.value + 1,
        winner: winners[0],
        value: skinsState.value.skinValue * (carryover + 1)
      })
    } else {
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