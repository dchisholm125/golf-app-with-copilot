<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWolfGameState } from '../composables/useWolfGameState'
import { loadGameState } from '../services/gameStateService'
import { getPlayersForGame } from '../services/gameService'
import Scoreboard from '../components/Scoreboard.vue'
import GameComplete from './GameComplete.vue'
import WolfPartnerSelect from '../components/WolfPartnerSelect.vue'
import WolfTeamsSummary from '../components/WolfTeamsSummary.vue'
import WolfHoleResult from '../components/WolfHoleResult.vue'

const route = useRoute()
const gameId = computed(() => Number(route.params.gameId))

// Use the composable for all state and logic
const {
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
  teeOrder,
} = useWolfGameState()

const isMobile = ref(false)

// Load game state on mount
onMounted(async () => {
  isMobile.value = window.innerWidth <= 600
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 600
  })
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
</script>

<template>
  <div class="wolf-game-page">
    <div class="wolf-game">
      <h3 class="mb-3">Wolf Game</h3>
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
      </div>
      <div v-else>
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
              <WolfPartnerSelect
                :players="players"
                :wolfPlayer="wolfPlayer"
                @choose-partner="choosePartner"
                @go-lone-wolf="goLoneWolf"
              />
            </div>
            <div v-else>
              <WolfTeamsSummary
                :wolfPlayer="wolfPlayer"
                :partnerPlayer="partnerPlayer"
                :nonWolfPlayers="nonWolfPlayers"
                :loneWolf="loneWolf"
              />
              <WolfHoleResult
                :wolfPlayer="wolfPlayer"
                :partnerPlayer="partnerPlayer"
                :nonWolfPlayers="nonWolfPlayers"
                :loneWolf="loneWolf"
                :holeWinner="holeWinner"
                @update:holeWinner="val => holeWinner = val"
                @submit-hole="submitHole"
              />
            </div>
            <!-- Tee Order Table -->
            <div class="mb-4 tee-order-wrapper">
              <h5 class="mb-2">Tee Order</h5>
              <div class="table-responsive">
                <table class="table table-sm table-bordered tee-order-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Order</th>
                      <th>Player</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(player, idx) in teeOrder" :key="player.name" :class="{ 'table-warning': player.name === wolfPlayer.name }">
                      <td>
                        <span v-if="idx === teeOrder.length - 1" class="fw-bold text-danger">Wolf</span>
                        <span v-else>{{ idx + 1 }}{{ ['st','nd','rd'][idx] || 'th' }}</span>
                      </td>
                      <td>
                        <span class="fw-bold">{{ player.name }}</span>
                        <span v-if="player.name === wolfPlayer.name" class="badge bg-warning text-dark ms-2">Wolf</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- End Tee Order Table -->
            <div class="mt-4">
              <h6>Scoreboard</h6>
              <Scoreboard :players="players" :holesPlayed="currentHole" title="Scoreboard" :mobileCondensed="isMobile" />
            </div>
          </template>
          <template v-else>
            <GameComplete :players="players" :gameType="'wolf'" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wolf-game-page {
  width: 100vw;
  min-height: 100vh;
  background: #fff;
  overflow-x: hidden;
}
.wolf-game {
  max-width: 420px;
  margin: 0 auto;
  padding: 1rem 1rem 2rem 1rem;
  box-sizing: border-box;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
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
.tee-order-wrapper,
.tee-order-table {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}
@media (max-width: 600px) {
  .tee-order-table, .tee-order-wrapper {
    max-width: 100%;
    font-size: 0.95rem;
  }
}
@media (min-width: 800px) {
  .wolf-game {
    max-width: 800px;
    padding: 2rem 2rem 3rem 2rem;
  }
}
</style>
