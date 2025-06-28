<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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
const scoreInputs = ref<Record<string, string>>({})

// Helper to get a unique key for each player
function getPlayerKey(player: any, idx: number) {
  return `player-${idx}`
}

// Initialize score inputs
function initializeScoreInputs() {
  scoreInputs.value = {}
  players.value.forEach((player, idx) => {
    const key = getPlayerKey(player, idx)
    const val = player.scores[currentHole.value]
    scoreInputs.value[key] = (typeof val === 'number' && val > 0) ? String(val) : ''
  })
}

// Handle score input change
function handleScoreChange(playerKey: string, score: number | undefined) {
  scoreInputs.value[playerKey] = score !== undefined ? String(score) : ''
  // Extract index from key
  const idx = Number(playerKey.replace('player-', ''))
  if (!isNaN(idx)) {
    updateScore(idx, currentHole.value, score ?? 0)
  }
}

// Prevent non-numeric input in score fields
function onScoreInput(e: Event) {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/[^\d]/g, '')
}

// Submit current hole
function handleSubmitHole() {
  // Validate all scores are entered
  const allScoresEntered = players.value.every((p, idx) => 
    parseInt(scoreInputs.value[getPlayerKey(p, idx)] || '') >= 1
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
  console.log('Players:', players.value)
})

function isFutureHole(hole: number) {
  return typeof hole === 'number' && hole > Number(currentHole) + 1
}

const numericSkinsResults = computed<{ hole: number; winner: number | null; value: number }[]>(() =>
  skinsResults.value.map(skin => ({
    ...skin,
    hole: Number(skin.hole)
  }))
)
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
                v-for="(player, idx) in players" 
                :key="getPlayerKey(player, idx)"
                class="col-md-6 mb-2"
              >
                <label class="form-label">{{ player.name }}</label>
                <input
                  v-model="scoreInputs[getPlayerKey(player, idx)]"
                  type="number"
                  min="1"
                  class="form-control"
                  @input="onScoreInput($event); handleScoreChange(getPlayerKey(player, idx), scoreInputs[getPlayerKey(player, idx)] ? parseInt(scoreInputs[getPlayerKey(player, idx)]) : undefined)"
                  placeholder="Score"
                />
              </div>
            </div>
            <button 
              class="btn btn-success mt-3" 
              @click="handleSubmitHole"
              :disabled="!players.every((p, idx) => parseInt(scoreInputs[getPlayerKey(p, idx)] || '') >= 1)"
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
                  <tr v-for="skin in numericSkinsResults" :key="skin.hole">
                    <td>{{ skin.hole }}</td>
                    <td>
                      <template v-if="isFutureHole(skin.hole)">
                        <!-- Future holes: leave blank -->
                      </template>
                      <template v-else>
                        <span v-if="typeof skin.winner === 'number'">
                          {{ players[skin.winner]?.name }}
                        </span>
                        <span v-else-if="skin.hole <= currentHole + 1" class="text-muted">Carryover</span>
                      </template>
                    </td>
                    <td>
                      <template v-if="isFutureHole(skin.hole)"></template>
                      <template v-else>${{ skin.value.toFixed(2) }}</template>
                    </td>
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

          <!-- Visual Debugging Section -->
          <div class="debug-section mb-4" style="background: #f8f9fa; border: 2px dashed #6c757d; padding: 1rem; border-radius: 8px;">
            <h6 style="color: #dc3545; font-weight: bold;">🐛 DEBUG INFO</h6>
            
            <div class="row">
              <div class="col-md-6">
                <strong>Score Inputs (scoreInputs ref):</strong>
                <pre style="background: #e9ecef; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem;">{{ JSON.stringify(scoreInputs, null, 2) }}</pre>
              </div>
              
              <div class="col-md-6">
                <strong>Current Hole:</strong> {{ currentHole }}<br>
                <strong>Players Count:</strong> {{ players.length }}<br>
                <strong>Game Started:</strong> {{ skinsState.gameStarted }}<br>
                <strong>Is Complete:</strong> {{ isComplete }}
              </div>
            </div>
            
            <div class="mt-2">
              <strong>Player Scores (from players array):</strong>
              <div v-for="(player, idx) in players" :key="idx" style="background: #e9ecef; padding: 0.5rem; margin: 0.25rem 0; border-radius: 4px; font-size: 0.8rem;">
                <strong>{{ player.name }} ({{ player.email }}):</strong><br>
                Key: {{ getPlayerKey(player, idx) }}<br>
                Current Hole Score: {{ player.scores?.[currentHole] }}<br>
                All Scores: {{ JSON.stringify(player.scores) }}
              </div>
            </div>
            
            <div class="mt-2">
              <strong>Input-to-Player Mapping:</strong>
              <div v-for="(player, idx) in players" :key="idx" style="background: #fff3cd; padding: 0.5rem; margin: 0.25rem 0; border-radius: 4px; font-size: 0.8rem;">
                {{ getPlayerKey(player, idx) }} → Input Value: "{{ scoreInputs[getPlayerKey(player, idx)] }}" → Parsed: {{ parseInt(scoreInputs[getPlayerKey(player, idx)] || '') || 'NaN' }}
              </div>
            </div>
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
  background: var(--bg-primary);
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
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.debug-section {
  background: #f8f9fa;
  border: 2px dashed #6c757d;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
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
