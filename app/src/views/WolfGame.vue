<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadGameState, saveGameState } from '../services/gameStateService'
import { getPlayersForGame } from '../services/gameService'
import Scoreboard from '../components/Scoreboard.vue'
import GameComplete from './GameComplete.vue'

interface Player {
  name: string
  scores: number[]
}

const route = useRoute()
const gameId = computed(() => Number(route.params.gameId))

const totalHoles = ref(18)
const players = ref<Player[]>([])
const gameStarted = ref(false)
const currentHole = ref(0)
const wolfOrder = ref<number[]>([])
const wolfPlayer = computed(() => {
  if (
    currentHole.value >= totalHoles.value ||
    !players.value.length ||
    !wolfOrder.value.length ||
    typeof wolfOrder.value[currentHole.value] !== 'number' ||
    typeof players.value[wolfOrder.value[currentHole.value] % players.value.length] === 'undefined'
  ) {
    return { name: '' }
  }
  return players.value[wolfOrder.value[currentHole.value] % players.value.length]
})
const partnerPlayer = ref<Player | null>(null)
const nonWolfPlayers = computed(() => players.value.filter(p => p !== wolfPlayer.value && p !== partnerPlayer.value))
const potentialPartners = ref<Player[]>([])
const pairingComplete = ref(false)
const loneWolf = ref(false)
const holeWinner = ref('')
const loading = ref(true)
const message = ref('')

const winners = computed(() => {
  const maxScore = Math.max(...players.value.map(p => p.scores.reduce((a, b) => a + b, 0)))
  return players.value.filter(p => p.scores.reduce((a, b) => a + b, 0) === maxScore)
})

// Load game state on mount
onMounted(async () => {
  if (!gameId.value) {
    message.value = 'No game ID found in route.'
    loading.value = false
    return
  }
  try {
    const state = await loadGameState(gameId.value)
    if (!state || !state.state_json) {
      // Game not found, redirect to game-select
      message.value = 'Game not found. Redirecting...'
      setTimeout(() => {
        window.location.href = '/game-select'
      }, 1500)
      return
    }
    // Fetch players from backend (canonical source)
    let playerList = []
    try {
      playerList = await getPlayersForGame(gameId.value)
    } catch (err) {
      // fallback to state_json.players if backend fails
      playerList = state.state_json.players || []
    }
    // Merge backend player info with scores from state_json.players
    const statePlayers = Array.isArray(state.state_json.players) ? state.state_json.players : []
    if (Array.isArray(playerList) && playerList.length) {
      players.value = playerList.map((p: any) => {
        // Try to find matching player in state_json.players by name or email
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
    else gameStarted.value = true // Default to true if not present (for older games)
    loading.value = false
  } catch (e) {
    message.value = 'Failed to load game state.'
    loading.value = false
  }
})

function startGame() {
  // Initialize players
  // For a new game, we can't use props, so just use the loaded state or fallback to a default
  if (!players.value.length) {
    // If no players loaded, create 4 default players
    for (let i = 0; i < 4; i++) {
      players.value.push({
        name: `Player ${i + 1}`,
        scores: Array(totalHoles.value).fill(0),
      })
    }
  }
  // Randomize wolf order
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

function skipPartner() {
  potentialPartners.value.shift()
}

function goLoneWolf() {
  loneWolf.value = true
  partnerPlayer.value = null
  pairingComplete.value = true
}

function autoPair() {
  // If only one left, auto-pair
  if (potentialPartners.value.length === 1) {
    partnerPlayer.value = potentialPartners.value[0]
    pairingComplete.value = true
  }
}

function submitHole() {
  // Scoring logic
  if (!pairingComplete.value) return
  const wolf = wolfPlayer.value as Player
  // Debug: log player scores before scoring
  console.log('Before scoring:', JSON.parse(JSON.stringify(players.value)))
  // Lone Wolf: wolf gets 2 if wins, else all others get 1
  if (loneWolf.value) {
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
    // Partnered: wolf+partner get 2 if win, else others get 2
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
  // Next hole
  if (currentHole.value < totalHoles.value - 1) {
    currentHole.value++
    pairingComplete.value = false
    loneWolf.value = false
    partnerPlayer.value = null
    potentialPartners.value = players.value.filter(p => p !== wolfPlayer.value)
    holeWinner.value = ''
  } else {
    // Game complete! Optionally, trigger a modal or route to GameComplete
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
  // Save state after each hole (now after increment)
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
</script>

<template>
  <div class="wolf-game container py-4">
    <h3 class="mb-3">Wolf Game</h3>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>
    <div v-else>
      <div class="mb-2 text-muted">
        Debug: currentHole = {{ currentHole }}, holesPlayed = {{ currentHole }}
      </div>
      <div v-if="message" class="alert alert-danger">{{ message }}</div>
      <div v-if="!gameStarted">
        <div class="alert alert-info">This game has not started yet. Please start the game to begin scoring.</div>
        <button class="btn btn-primary" @click="startGame">Start Wolf Game</button>
      </div>
      <div v-else>
        <template v-if="currentHole < totalHoles">
          <h5>Hole {{ currentHole + 1 }} / {{ totalHoles }}</h5>
          <div class="mb-2">
            <strong>Wolf for this hole:</strong> {{ wolfPlayer.name }}
          </div>
          <div v-if="!pairingComplete">
            <div class="mb-3">
              <p>Choose a partner for <strong>{{ wolfPlayer.name }}</strong> or go Lone Wolf:</p>
              <div class="player-tile-grid">
                <button
                  v-for="partner in players.filter(p => p !== wolfPlayer)"
                  :key="partner.name"
                  class="btn btn-outline-success btn-sm mt-2"
                  @click="choosePartner(partner)"
                >
                  <span class="fw-bold">{{ partner.name }}</span>
              </button>
              </div>
            </div>
            <button class="btn btn-warning me-2" @click="goLoneWolf">Go Lone Wolf</button>
          </div>
          <div v-else>
            <div v-if="loneWolf">
              <p><strong>{{ wolfPlayer.name }}</strong> is going <span class="text-danger">Lone Wolf</span>!</p>
              <p>Teams: <strong>{{ wolfPlayer.name }}</strong> vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
            </div>
            <div v-else>
              <p>Teams: <strong>{{ wolfPlayer.name }}</strong><span v-if="partnerPlayer"> + {{ partnerPlayer.name }}</span> vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
            </div>
            <div class="mb-2">
              <label class="form-label">Who won the hole?</label>
              <select v-model="holeWinner" class="form-select" style="max-width: 300px;">
                <option :value="wolfPlayer.name">Wolf{{ loneWolf ? ' (Lone Wolf)' : (partnerPlayer ? ' + Partner' : '') }}</option>
                <option v-if="loneWolf" :value="'Team'">Team of 3</option>
                <option v-else :value="'OtherTeam'">Other Team</option>
              </select>
            </div>
            <button class="btn btn-success me-2" @click="submitHole">Submit Hole</button>
          </div>
          <div class="mt-4">
            <h6>Scoreboard</h6>
            <Scoreboard :players="players" :holesPlayed="currentHole" title="Scoreboard" />
          </div>
        </template>
        <template v-else>
          <GameComplete :players="players" :gameType="'wolf'" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wolf-game {
  max-width: 800px;
}
.player-tile-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
.player-tile {
  width: 140px;
  transition: box-shadow 0.2s, background 0.2s;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e0e0e0;
  /* Ensure text stays on one line, wrapping only after a word */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}
.player-tile .fw-bold {
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
  display: inline-block;
}
</style>
