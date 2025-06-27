import { ref, computed } from 'vue'
import { useGameState, type Player } from './useGameState'

export interface WolfGameState {
  wolfOrder: number[]
  partnerPlayer: Player | null
  pairingComplete: boolean
  loneWolf: boolean
  holeWinner: string
  gameStarted: boolean
}

export function useWolfGameLogic() {
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
  
  // Wolf-specific state
  const wolfState = ref<WolfGameState>({
    wolfOrder: [],
    partnerPlayer: null,
    pairingComplete: false,
    loneWolf: false,
    holeWinner: '',
    gameStarted: false,
  })
  
  // Computed properties
  const wolfPlayer = computed<Player>(() => {
    if (!players.value.length || !wolfState.value.wolfOrder.length) {
      return players.value[0] || { name: '', email: '', scores: [] }
    }
    const idx = wolfState.value.wolfOrder[wolfState.value.wolfOrder.length - 1]
    return players.value[idx] || players.value[0]
  })
  
  const nonWolfPlayers = computed(() => 
    players.value.filter(p => p !== wolfPlayer.value && p !== wolfState.value.partnerPlayer)
  )
  
  const potentialPartners = computed(() => 
    players.value.filter(p => p !== wolfPlayer.value)
  )
  
  const teeOrder = computed(() => 
    wolfState.value.wolfOrder.map(idx => players.value[idx])
  )
  
  // Actions
  function startGame() {
    if (!players.value.length) {
      // Initialize with default players if none exist
      for (let i = 0; i < 4; i++) {
        players.value.push({
          name: `Player ${i + 1}`,
          email: `player${i + 1}@example.com`,
          scores: Array(totalHoles.value).fill(0),
        })
      }
    }
    
    wolfState.value = {
      wolfOrder: Array.from({ length: players.value.length }, (_, i) => i),
      partnerPlayer: null,
      pairingComplete: false,
      loneWolf: false,
      holeWinner: '',
      gameStarted: true,
    }
    
    saveWolfState()
  }
  
  function choosePartner(partner: Player) {
    wolfState.value.partnerPlayer = partner
    wolfState.value.pairingComplete = true
    saveWolfState()
  }
  
  function goLoneWolf() {
    wolfState.value.loneWolf = true
    wolfState.value.partnerPlayer = null
    wolfState.value.pairingComplete = true
    saveWolfState()
  }
  
  function setHoleWinner(winner: string) {
    wolfState.value.holeWinner = winner
  }
  
  function submitHole() {
    if (!wolfState.value.pairingComplete) return
    
    const wolf = wolfPlayer.value
    const partner = wolfState.value.partnerPlayer
    
    // Apply Wolf game scoring rules
    if (!wolfState.value.holeWinner || wolfState.value.holeWinner.toLowerCase() === 'tie') {
      // Tie: no points awarded
      players.value.forEach(p => {
        updatePlayerScore(players.value.indexOf(p), currentHole.value, 0)
      })
    } else if (wolfState.value.loneWolf) {
      // Lone wolf scenario
      if (wolfState.value.holeWinner === wolf.name) {
        updatePlayerScore(players.value.indexOf(wolf), currentHole.value, 2)
        players.value.forEach(p => {
          if (p !== wolf) updatePlayerScore(players.value.indexOf(p), currentHole.value, 0)
        })
      } else {
        players.value.forEach(p => {
          if (p !== wolf) updatePlayerScore(players.value.indexOf(p), currentHole.value, 1)
          else updatePlayerScore(players.value.indexOf(wolf), currentHole.value, 0)
        })
      }
    } else {
      // Partner scenario
      if (wolfState.value.holeWinner === wolf.name || wolfState.value.holeWinner === partner?.name) {
        // Wolf + partner win
        updatePlayerScore(players.value.indexOf(wolf), currentHole.value, 1)
        if (partner) updatePlayerScore(players.value.indexOf(partner), currentHole.value, 1)
        players.value.forEach(p => {
          if (p !== wolf && p !== partner) updatePlayerScore(players.value.indexOf(p), currentHole.value, 0)
        })
      } else {
        // Opposing team wins
        players.value.forEach(p => {
          if (p !== wolf && p !== partner) updatePlayerScore(players.value.indexOf(p), currentHole.value, 1)
          else updatePlayerScore(players.value.indexOf(p), currentHole.value, 0)
        })
      }
    }
    
    // Rotate wolf order
    const last = wolfState.value.wolfOrder.pop()
    if (last !== undefined) {
      wolfState.value.wolfOrder.unshift(last)
    }
    
    // Reset for next hole
    if (currentHole.value < totalHoles.value - 1) {
      advanceHole()
      wolfState.value.pairingComplete = false
      wolfState.value.loneWolf = false
      wolfState.value.partnerPlayer = null
      wolfState.value.holeWinner = ''
    } else {
      advanceHole()
    }
    
    saveWolfState()
  }
  
  async function saveWolfState() {
    await saveState({
      wolfOrder: wolfState.value.wolfOrder,
      partnerPlayer: wolfState.value.partnerPlayer,
      pairingComplete: wolfState.value.pairingComplete,
      loneWolf: wolfState.value.loneWolf,
      holeWinner: wolfState.value.holeWinner,
      gameStarted: wolfState.value.gameStarted,
    })
  }
  
  async function loadWolfState() {
    await loadState()
    
    // Load Wolf-specific state from state_json
    if (gameState.value) {
      const stateJson = gameState.value as any
      wolfState.value = {
        wolfOrder: Array.isArray(stateJson.wolfOrder) ? stateJson.wolfOrder : [],
        partnerPlayer: stateJson.partnerPlayer || null,
        pairingComplete: stateJson.pairingComplete || false,
        loneWolf: stateJson.loneWolf || false,
        holeWinner: stateJson.holeWinner || '',
        gameStarted: stateJson.gameStarted !== false, // Default to true
      }
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
    
    // Wolf-specific state
    wolfState,
    wolfPlayer,
    nonWolfPlayers,
    potentialPartners,
    teeOrder,
    
    // Actions
    loadWolfState,
    startGame,
    choosePartner,
    goLoneWolf,
    setHoleWinner,
    submitHole,
  }
} 