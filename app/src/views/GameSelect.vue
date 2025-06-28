<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createGame, type GameCreateRequest } from '../services/gameService'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useCurrentGameId } from '../composables/useCurrentGameId'
import { loadGameState } from '../services/gameStateService'
import { useNavigation } from '../services/navigationService'

const router = useRouter()
const navigation = useNavigation()

const numPlayers = ref(4)
const numHoles = ref(18)
const selectedGame = ref('wolf')
const message = ref('')
const loading = ref(false)
const wolfGameState = ref<any>(null)
const skinValue = ref<number | null>(null)

const games = [
  { value: 'wolf', label: 'Wolf' },
  { value: 'skins', label: 'Skins' },
  { value: 'sixsixsix', label: 'SixSixSix' },
]

const players = ref([
  { name: '', email: '' },
  { name: '', email: '' },
  { name: '', email: '' },
  { name: '', email: '' },
])

const { name: currentUserName, email: currentUserEmail, isAuthenticated } = useCurrentUser()
const { currentGameId, setCurrentGameId } = useCurrentGameId()

// Set player 1 to current user info if authenticated
watch(
  [isAuthenticated, currentUserName, currentUserEmail],
  ([auth, name, email]) => {
    if (auth) {
      players.value[0].name = name
      players.value[0].email = email
    }
  },
  { immediate: true }
)

watch(numPlayers, (newVal) => {
  // Adjust players array length
  while (players.value.length < newVal) players.value.push({ name: '', email: '' })
  while (players.value.length > newVal) players.value.pop()
})

const isWolfGame = computed(() => selectedGame.value === 'wolf')

const canStartGame = computed(() => {
  if (isWolfGame.value) {
    if (numPlayers.value !== 4) return false
    // All 4 players must have name and email
    return players.value.slice(0, 4).every(p => p.name.trim() && p.email.trim())
  }
  // For other games, allow if at least 2 players with info
  return players.value.slice(0, numPlayers.value).every(p => p.name.trim() && p.email.trim())
})

async function startGame() {
  message.value = ''
  loading.value = true
  try {
    // Prepare payload for backend
    const payload: GameCreateRequest = {
      game_type: selectedGame.value,
      players: players.value.slice(0, numPlayers.value).map(p => ({
        name: p.name,
        email: p.email,
      })),
      num_holes: numHoles.value,
    }
    if (selectedGame.value === 'skins' && skinValue.value !== null) {
      payload.skin_value = skinValue.value
    }
    const res = await createGame(payload)
    setCurrentGameId(res.game_id)
    // Redirect to the appropriate game route
    if (selectedGame.value === 'wolf') {
      navigation.goToWolfGame(res.game_id)
    } else if (selectedGame.value === 'skins') {
      navigation.goToSkinsGame(res.game_id)
    } else if (selectedGame.value === 'sixsixsix') {
      // navigation.goToSixSixSixGame(res.game_id)
    }
  } catch (err: any) {
    message.value = err?.response?.data?.detail || 'Failed to create game.'
  } finally {
    loading.value = false
  }
}

// Restore game state if gameId is present on mount
onMounted(async () => {
  console.log('[GameSelect] onMounted: currentGameId', currentGameId.value)
  if (currentGameId.value) {
    try {
      const state = await loadGameState(currentGameId.value)
      console.log('[GameSelect] Loaded state from backend:', state)
      if (state && state.state_json) {
        selectedGame.value = 'wolf' // or use state.state_json.gameType if stored
        wolfGameState.value = state.state_json
        numPlayers.value = state.state_json.players?.length || 4
        players.value = state.state_json.players?.map((p: any) => ({ name: p.name, email: p.email })) || players.value
        console.log('[GameSelect] Restored WolfGame state:', wolfGameState.value)
      }
    } catch (e) {
      console.log('[GameSelect] Error loading state from backend:', e)
    }
  }
})

watch(currentGameId, (val) => {
  console.log('[GameSelect] currentGameId changed:', val)
  if (val) {
    localStorage.setItem('currentGameId', String(val))
  } else {
    localStorage.removeItem('currentGameId')
  }
})
</script>

<template>
  <div class="container py-5">
    <div>
      <h2 class="mb-4">Choose Your Game</h2>
      <div class="mb-3">
        <label class="form-label">Number of Players</label>
        <select v-model="numPlayers" class="form-select" style="max-width: 200px;" :disabled="isWolfGame">
          <option v-for="n in [1,2,3,4]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Number of Holes</label>
        <select v-model="numHoles" class="form-select" style="max-width: 200px;">
          <option :value="9">9 Holes</option>
          <option :value="18">18 Holes</option>
        </select>
      </div>
      <div class="mb-3">
        <h5>Player Information</h5>
        <div v-for="(player, idx) in players" :key="idx" class="row mb-2 align-items-center">
          <div class="col-md-5">
            <input
              v-model="player.name"
              type="text"
              class="form-control"
              :placeholder="`Player ${idx+1} Name`"
              :readonly="idx === 0 && isAuthenticated"
              :disabled="idx === 0 && isAuthenticated"
            />
          </div>
          <div class="col-md-5">
            <input
              v-model="player.email"
              type="email"
              class="form-control"
              :placeholder="`Player ${idx+1} Email`"
              :readonly="idx === 0 && isAuthenticated"
              :disabled="idx === 0 && isAuthenticated"
            />
          </div>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Game Type</label>
        <select v-model="selectedGame" class="form-select" style="max-width: 200px;">
          <option v-for="game in games" :key="game.value" :value="game.value">{{ game.label }}</option>
        </select>
      </div>
      <div class="mb-3" v-if="selectedGame === 'skins'">
        <label class="form-label">Skin Value (Buy-in per Skin)</label>
        <input v-model.number="skinValue" type="number" min="0" step="0.01" class="form-control" style="max-width: 200px;" placeholder="Enter skin value ($)" />
      </div>
      <div class="mb-4">
        <button
          class="btn btn-success me-2"
          @click="startGame"
          :disabled="loading || !canStartGame"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Start Game
        </button>
      </div>
    </div>
  </div>
</template>
