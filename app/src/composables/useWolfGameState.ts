import { ref, computed, onMounted } from 'vue'
import { loadGameState, saveGameState } from '../services/gameStateService'
import { getPlayersForGame } from '../services/gameService'
import { useRoute } from 'vue-router'

export interface Player {
  name: string
  scores: number[]
}

export function useWolfGameState() {
  const route = useRoute()
  const gameId = computed(() => Number(route.params.gameId))
  const totalHoles = ref(18)
  const players = ref<Player[]>([])
  const gameStarted = ref(false)
  const currentHole = ref(0)
  const wolfOrder = ref<number[]>([])
  const partnerPlayer = ref<Player | null>(null)
  const pairingComplete = ref(false)
  const loneWolf = ref(false)
  const holeWinner = ref('')
  const loading = ref(true)
  const message = ref('')
  const potentialPartners = ref<Player[]>([])

  const wolfPlayer = computed<Player>(() => {
    // Defensive: always return a valid Player object
    if (
      currentHole.value >= totalHoles.value ||
      !players.value.length ||
      !wolfOrder.value.length ||
      typeof wolfOrder.value[currentHole.value] !== 'number'
    ) {
      // Defensive fallback: first player or empty
      if (players.value.length > 0) {
        return players.value[0]
      }
      return { name: '', scores: Array(totalHoles.value).fill(0) }
    }
    const idx = wolfOrder.value[currentHole.value] % players.value.length
    const player = players.value[idx]
    if (!player) {
      // Defensive fallback: first player
      return players.value[0]
    }
    return player
  })

  const nonWolfPlayers = computed(() => players.value.filter(p => p !== wolfPlayer.value && p !== partnerPlayer.value))

  onMounted(async () => {
    if (!gameId.value) {
      message.value = 'No game ID found in route.'
      loading.value = false
      return
    }
    try {
      const state = await loadGameState(gameId.value)
      if (!state || !state.state_json) {
        message.value = 'Game not found. Redirecting...'
        setTimeout(() => {
          window.location.href = '/game-select'
        }, 1500)
        return
      }
      let playerList = []
      try {
        playerList = await getPlayersForGame(gameId.value)
      } catch (err) {
        playerList = state.state_json.players || []
      }
      const statePlayers = Array.isArray(state.state_json.players) ? state.state_json.players : []
      if (Array.isArray(playerList) && playerList.length) {
        players.value = playerList.map((p: any) => {
          const match = statePlayers.find((sp: any) => sp.name === p.name || sp.email === p.email)
          return {
            name: p.name,
            scores: match && Array.isArray(match.scores) ? match.scores : Array(totalHoles.value).fill(0),
          }
        })
      } else if (statePlayers.length) {
        players.value = statePlayers
      }
      if (typeof state.state_json.currentHole === 'number' && !isNaN(state.state_json.currentHole)) {
        currentHole.value = state.state_json.currentHole
      } else {
        currentHole.value = 0
      }
      if (state.state_json.wolfOrder) wolfOrder.value = state.state_json.wolfOrder
      if (state.state_json.numHoles) totalHoles.value = state.state_json.numHoles
      if (typeof state.state_json.loneWolf === 'boolean') loneWolf.value = state.state_json.loneWolf
      if (typeof state.state_json.pairingComplete === 'boolean') pairingComplete.value = state.state_json.pairingComplete
      if (state.state_json.partnerPlayer) partnerPlayer.value = state.state_json.partnerPlayer
      if (state.state_json.potentialPartners) potentialPartners.value = state.state_json.potentialPartners
      if (typeof state.state_json.holeWinner === 'string') holeWinner.value = state.state_json.holeWinner
      if (typeof state.state_json.gameStarted === 'boolean') gameStarted.value = state.state_json.gameStarted
      else gameStarted.value = true
      loading.value = false
    } catch (e) {
      message.value = 'Failed to load game state.'
      loading.value = false
    }
  })

  function startGame() {
    if (!players.value.length) {
      for (let i = 0; i < 4; i++) {
        players.value.push({
          name: `Player ${i + 1}`,
          scores: Array(totalHoles.value).fill(0),
        })
      }
    }
    wolfOrder.value = Array.from({ length: totalHoles.value }, (_, i) => i % players.value.length)
    for (let i = wolfOrder.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[wolfOrder.value[i], wolfOrder.value[j]] = [wolfOrder.value[j], wolfOrder.value[i]]
    }
    currentHole.value = 0
    pairingComplete.value = false
    loneWolf.value = false
    partnerPlayer.value = null
    potentialPartners.value = players.value.filter(p => p !== wolfPlayer.value)
    gameStarted.value = true
    holeWinner.value = ''
  }

  function choosePartner(partner: Player) {
    partnerPlayer.value = partner
    pairingComplete.value = true
  }

  function goLoneWolf() {
    loneWolf.value = true
    partnerPlayer.value = null
    pairingComplete.value = true
  }

  function submitHole() {
    if (!pairingComplete.value) return
    const wolf = wolfPlayer.value as Player
    // Debug: log player scores before scoring
    console.log('Before scoring:', JSON.parse(JSON.stringify(players.value)))

    // Tie logic: if no winner is selected, award 0 points to all
    if (!holeWinner.value || holeWinner.value.toLowerCase() === 'tie') {
      players.value.forEach(p => {
        p.scores[currentHole.value] = 0
      })
    } else if (loneWolf.value) {
      if (holeWinner.value === wolf.name && Array.isArray(wolf.scores)) {
        wolf.scores[currentHole.value] = 2
        players.value.forEach(p => {
          if (p !== wolf) p.scores[currentHole.value] = 0
        })
      } else {
        players.value.forEach(p => {
          if (p !== wolf) p.scores[currentHole.value] = 1
          else p.scores[currentHole.value] = 0
        })
      }
    } else {
      if ((holeWinner.value === wolf.name || holeWinner.value === partnerPlayer.value?.name) && Array.isArray(wolf.scores) && partnerPlayer.value && Array.isArray(partnerPlayer.value.scores)) {
        wolf.scores[currentHole.value] = 2
        partnerPlayer.value.scores[currentHole.value] = 2
        players.value.forEach(p => {
          if (p !== wolf && p !== partnerPlayer.value) p.scores[currentHole.value] = 0
        })
      } else {
        players.value.forEach(p => {
          if (p !== wolf && p !== partnerPlayer.value) p.scores[currentHole.value] = 2
          else p.scores[currentHole.value] = 0
        })
      }
    }
    // Debug: log player scores after scoring
    console.log('After scoring:', JSON.parse(JSON.stringify(players.value)))
    if (currentHole.value < totalHoles.value - 1) {
      currentHole.value++
      pairingComplete.value = false
      loneWolf.value = false
      partnerPlayer.value = null
      potentialPartners.value = players.value.filter(p => p !== wolfPlayer.value)
      holeWinner.value = ''
    } else {
      currentHole.value++
    }
    // Debug: log state before saving
    console.log('Saving state:', {
      current_hole: currentHole.value,
      state_json: {
        players: players.value,
        currentHole: currentHole.value,
        wolfOrder: wolfOrder.value,
        numHoles: totalHoles.value,
        loneWolf: loneWolf.value,
        pairingComplete: pairingComplete.value,
        partnerPlayer: partnerPlayer.value,
        potentialPartners: potentialPartners.value,
        holeWinner: holeWinner.value,
        gameStarted: gameStarted.value,
      }
    })
    saveGameState(gameId.value, {
      current_hole: currentHole.value,
      state_json: {
        players: players.value,
        currentHole: currentHole.value,
        wolfOrder: wolfOrder.value,
        numHoles: totalHoles.value,
        loneWolf: loneWolf.value,
        pairingComplete: pairingComplete.value,
        partnerPlayer: partnerPlayer.value,
        potentialPartners: potentialPartners.value,
        holeWinner: holeWinner.value,
        gameStarted: gameStarted.value,
      }
    })
  }

  return {
    gameId,
    totalHoles,
    players,
    gameStarted,
    currentHole,
    wolfOrder,
    wolfPlayer,
    partnerPlayer,
    nonWolfPlayers,
    potentialPartners,
    pairingComplete,
    loneWolf,
    holeWinner,
    loading,
    message,
    startGame,
    choosePartner,
    goLoneWolf,
    submitHole,
  }
}
