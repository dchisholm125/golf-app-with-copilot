<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadGameState, saveGameState } from '../services/gameStateService'
import Scoreboard from '../components/Scoreboard.vue'

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
const wolfPlayer = computed(() => players.value[wolfOrder.value[currentHole.value] % players.value.length])
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
    if (state && state.state_json) {
      // Restore all relevant state
      if (state.state_json.players) players.value = state.state_json.players
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
    }
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
  if (loneWolf.value) {
    if (holeWinner.value === wolfPlayer.value.name) {
      wolfPlayer.value.scores[currentHole.value] = 2
    } else {
      nonWolfPlayers.value.forEach(p => (p.scores[currentHole.value] = 1))
    }
  } else {
    if (holeWinner.value === wolfPlayer.value.name || holeWinner.value === partnerPlayer.value?.name) {
      wolfPlayer.value.scores[currentHole.value] = 1
      partnerPlayer.value!.scores[currentHole.value] = 1
    } else {
      nonWolfPlayers.value.forEach(p => (p.scores[currentHole.value] = 1))
    }
  }
  // Next hole
  currentHole.value++
  if (currentHole.value < totalHoles.value) {
    pairingComplete.value = false
    loneWolf.value = false
    partnerPlayer.value = null
    potentialPartners.value = players.value.filter(p => p !== wolfPlayer.value)
    holeWinner.value = ''
  }
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
        <p>Players: <span v-for="(p, i) in players" :key="i">{{ p.name }}<span v-if="i < players.length - 1">, </span></span></p>
        <button class="btn btn-primary" @click="startGame">Start Wolf Game</button>
      </div>
      <div v-else>
        <h5>Hole {{ currentHole + 1 }} / {{ totalHoles }}</h5>
        <div class="mb-2">
          <strong>Wolf for this hole:</strong> {{ wolfPlayer.name }}
        </div>
        <div v-if="!pairingComplete">
          <div v-if="potentialPartners.length">
            <p>Next to tee off: <strong>{{ potentialPartners[0].name }}</strong></p>
            <button class="btn btn-outline-success me-2" @click="choosePartner(potentialPartners[0])">Choose as Partner</button>
            <button class="btn btn-outline-secondary" @click="skipPartner">Skip</button>
          </div>
          <div v-else>
            <button class="btn btn-warning me-2" @click="goLoneWolf">Go Lone Wolf</button>
            <button class="btn btn-info" @click="autoPair">Auto Pair (last partner)</button>
          </div>
        </div>
        <div v-else>
          <div v-if="loneWolf">
            <p><strong>{{ wolfPlayer.name }}</strong> is going <span class="text-danger">Lone Wolf</span>!</p>
            <p>Teams: <strong>{{ wolfPlayer.name }}</strong> vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
          </div>
          <div v-else>
            <p>Teams: <strong>{{ wolfPlayer.name }}</strong> + {{ partnerPlayer.name }} vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
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
        <div v-if="currentHole >= totalHoles">
          <h4 class="text-success">Game Over!</h4>
          <p>Winner(s):
            <span v-for="(p, i) in winners" :key="i">{{ p.name }}<span v-if="i < winners.length - 1">, </span></span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wolf-game {
  max-width: 800px;
}
</style>
