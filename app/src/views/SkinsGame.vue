<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSkinsGameLogic } from '../composables/useSkinsGameLogic'
import { useResponsive } from '../composables/useResponsive'
import { useCurrentUser } from '../composables/useCurrentUser'
import GameScoreboard from '../components/GameScoreboard.vue'
import GameComplete from './GameComplete.vue'

// Use the new Skins game logic composable
const {
  loading,
  error,
  gameId,
  currentHole,
  totalHoles,
  players,
  isComplete,
  gameType,
  skinsState,
  playerScores,
  skinsResults,
  playerTotals,
  loadSkinsState,
  startGame,
  updateScore,
  submitHole,
  completeGame,
} = useSkinsGameLogic()

const { isMobile } = useResponsive()
const { email: currentUserEmail } = useCurrentUser()

// Local state for score entry
const scoreInputs = ref<Record<string, number>>({})

// Initialize score inputs
function initializeScoreInputs() {
  scoreInputs.value = {}
  players.value.forEach(player => {
    scoreInputs.value[player.email] = player.scores[currentHole.value] || 0
  })
}

// Handle score input change
function handleScoreChange(playerEmail: string, score: number) {
  scoreInputs.value[playerEmail] = score
  updateScore(playerEmail, currentHole.value, score)
}

// Submit current hole
function handleSubmitHole() {
  // Validate all scores are entered
  const allScoresEntered = players.value.every(player => 
    scoreInputs.value[player.email] !== undefined && scoreInputs.value[player.email] > 0
  )
  
  if (!allScoresEntered) {
    alert('Please enter scores for all players before submitting.')
    return
  }
  
  submitHole()
  
  // Re-initialize inputs for next hole
  if (!isComplete.value) {
    initializeScoreInputs()
  }
}

// Load game state on mount
onMounted(async () => {
  await loadSkinsState()
  initializeScoreInputs()
})
</script>

<template>
  <div class="skins-game-page">
    <div class="skins-game mt-3 me-5">
      <h3 class="mb-3">Skins Game</h3>
      
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
        <div v-if="!skinsState.gameStarted">
          <div class="alert alert-info">
            This game has not started yet. Please start the game to begin scoring.
          </div>
          <div class="mb-3">
            <label class="form-label">Skin Value (Buy-in per Skin)</label>
            <input 
              v-model.number="skinsState.skinValue" 
              type="number" 
              min="0" 
              step="0.01" 
              class="form-control" 
              style="max-width: 200px;" 
              placeholder="Enter skin value ($)" 
            />
          </div>
          <button 
            class="btn btn-primary" 
            @click="startGame(skinsState.skinValue)"
            :disabled="skinsState.skinValue <= 0"
          >
            Start Skins Game
          </button>
        </div>
        
        <!-- Game in progress -->
        <div v-else-if="!isComplete">
          <h5>Hole {{ currentHole + 1 }} / {{ totalHoles }}</h5>
          
          <!-- Score entry -->
          <div class="score-entry-section mb-4">
            <h6>Enter Scores</h6>
            <div class="row">
              <div 
                v-for="player in players" 
                :key="player.email"
                class="col-md-6 mb-2"
              >
                <label class="form-label">{{ player.name }}</label>
                <input
                  v-model.number="scoreInputs[player.email]"
                  type="number"
                  min="1"
                  class="form-control"
                  @input="handleScoreChange(player.email, scoreInputs[player.email])"
                  placeholder="Score"
                />
              </div>
            </div>
            <button 
              class="btn btn-success mt-3" 
              @click="handleSubmitHole"
              :disabled="!players.every(p => scoreInputs[p.email] > 0)"
            >
              Submit Hole
            </button>
          </div>
          
          <!-- Skins results so far -->
          <div class="skins-results-section mb-4">
            <h6>Skins Results</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Hole</th>
                    <th>Winner</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="skin in skinsResults" :key="skin.hole">
                    <td>{{ skin.hole }}</td>
                    <td>
                      <span v-if="skin.winner">
                        {{ players.find(p => p.email === skin.winner)?.name }}
                      </span>
                      <span v-else class="text-muted">Carryover</span>
                    </td>
                    <td>${{ skin.value.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Player totals -->
          <div class="player-totals-section mb-4">
            <h6>Player Totals</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Skins Won</th>
                    <th>Total Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in players" :key="player.email">
                    <td>{{ player.name }}</td>
                    <td>{{ playerTotals[player.email]?.skins || 0 }}</td>
                    <td>${{ (playerTotals[player.email]?.winnings || 0).toFixed(2) }}</td>
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
              :highlightCurrentUser="true"
              :currentUserEmail="currentUserEmail"
            />
          </div>
        </div>
        
        <!-- Game complete -->
        <div v-else>
          <GameComplete 
            :players="players" 
            :gameType="'skins'" 
            :gameId="gameId"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skins-game-page {
  width: 100%;
  min-height: 100vh;
  background: #fff;
  overflow-x: hidden;
}

.skins-game {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

.score-entry-section,
.skins-results-section,
.player-totals-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

@media (max-width: 600px) {
  .skins-game {
    max-width: 100%;
    padding: 0.5rem;
  }
  
  .score-entry-section,
  .skins-results-section,
  .player-totals-section {
    padding: 0.75rem;
  }
}
</style>
