<script setup lang="ts">
import { onMounted } from 'vue'
import { useWolfGameLogic } from '../composables/useWolfGameLogic'
import { useResponsive } from '../composables/useResponsive'
import GameScoreboard from '../components/GameScoreboard.vue'
import GameComplete from './GameComplete.vue'
import WolfPartnerSelect from '../components/WolfPartnerSelect.vue'
import WolfTeamsSummary from '../components/WolfTeamsSummary.vue'
import WolfHoleResult from '../components/WolfHoleResult.vue'

// Use the new Wolf game logic composable
const {
  loading,
  error,
  gameId,
  currentHole,
  totalHoles,
  players,
  isComplete,
  gameType,
  wolfState,
  wolfPlayer,
  nonWolfPlayers,
  potentialPartners,
  teeOrder,
  loadWolfState,
  startGame,
  choosePartner,
  goLoneWolf,
  setHoleWinner,
  submitHole,
} = useWolfGameLogic()

const { isMobile } = useResponsive()

// Load game state on mount
onMounted(async () => {
  await loadWolfState()
})
</script>

<template>
  <div class="wolf-game-page">
    <div class="wolf-game mt-3 me-5">
      <h3 class="mb-3">Wolf Game</h3>
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Game content -->
      <div v-else>
        <!-- Game not started -->
        <div v-if="!wolfState.gameStarted">
          <div class="alert alert-info">
            This game has not started yet. Please start the game to begin scoring.
          </div>
          <button class="btn btn-primary" @click="startGame">
            Start Wolf Game
          </button>
        </div>
        
        <!-- Game in progress -->
        <div v-else-if="!isComplete">
          <h5>Hole {{ currentHole + 1 }} / {{ totalHoles }}</h5>
          
          <!-- Wolf player info -->
          <div class="mb-2">
            <strong>Wolf for this hole:</strong> {{ wolfPlayer.name }}
          </div>
          
          <!-- Partner selection phase -->
          <div v-if="!wolfState.pairingComplete">
            <WolfPartnerSelect
              :players="players"
              :wolfPlayer="wolfPlayer"
              @choose-partner="choosePartner"
              @go-lone-wolf="goLoneWolf"
            />
          </div>
          
          <!-- Game play phase -->
          <div v-else>
            <WolfTeamsSummary
              :wolfPlayer="wolfPlayer"
              :partnerPlayer="wolfState.partnerPlayer"
              :nonWolfPlayers="nonWolfPlayers"
              :loneWolf="wolfState.loneWolf"
            />
            
            <WolfHoleResult
              :wolfPlayer="wolfPlayer"
              :partnerPlayer="wolfState.partnerPlayer"
              :nonWolfPlayers="nonWolfPlayers"
              :loneWolf="wolfState.loneWolf"
              :holeWinner="wolfState.holeWinner"
              @update:holeWinner="setHoleWinner"
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
                  <tr 
                    v-for="(player, idx) in teeOrder" 
                    :key="player.name" 
                    :class="{ 'table-warning': player.name === wolfPlayer.name }"
                  >
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
          
          <!-- Scoreboard -->
          <div class="mt-4">
            <GameScoreboard 
              :players="players" 
              :holesPlayed="currentHole" 
              title="Scoreboard"
            />
          </div>
        </div>
        
        <!-- Game complete -->
        <div v-else>
          <GameComplete 
            :players="players" 
            :gameType="'wolf'" 
            :gameId="gameId"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wolf-game-page {
  width: 100%;
  min-height: 100vh;
  background: #fff;
  overflow-x: hidden;
}

.wolf-game {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

.tee-order-wrapper {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.tee-order-table {
  margin-bottom: 0;
}

.tee-order-table th,
.tee-order-table td {
  padding: 0.5rem;
  text-align: center;
  vertical-align: middle;
}

@media (max-width: 600px) {
  .wolf-game {
    max-width: 100%;
    padding: 0.5rem;
  }
  
  .tee-order-wrapper {
    padding: 0.75rem;
  }
  
  .tee-order-table th,
  .tee-order-table td {
    padding: 0.25rem;
    font-size: 0.9rem;
  }
}
</style>
