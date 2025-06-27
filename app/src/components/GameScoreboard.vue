<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '../composables/useResponsive'

export interface Player {
  name: string
  email: string
  scores: number[]
}

interface Props {
  players: Player[]
  holesPlayed: number
  title?: string
  showEmail?: boolean
  highlightCurrentUser?: boolean
  currentUserEmail?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Scoreboard',
  showEmail: false,
  highlightCurrentUser: false,
  currentUserEmail: '',
})

const { isMobile } = useResponsive()

// Computed properties
const completedHoles = computed(() => Math.max(0, props.holesPlayed))
const lastHoleIdx = computed(() => Math.max(0, props.holesPlayed - 1))

const playerTotals = computed(() => 
  props.players.map(player => ({
    ...player,
    total: player.scores.slice(0, completedHoles.value).reduce((a, b) => a + b, 0)
  }))
)

const sortedPlayers = computed(() => 
  [...playerTotals.value].sort((a, b) => b.total - a.total)
)

function isCurrentUser(player: Player): boolean {
  return props.highlightCurrentUser && player.email === props.currentUserEmail
}
</script>

<template>
  <div class="game-scoreboard">
    <h6 v-if="title" class="scoreboard-title">{{ title }}</h6>
    
    <!-- Mobile condensed view -->
    <div v-if="isMobile" class="scoreboard-mobile">
      <div class="scoreboard-section">
        <h6 class="section-title">Last Hole</h6>
        <div class="player-list">
          <div 
            v-for="player in sortedPlayers" 
            :key="player.name"
            class="player-row"
            :class="{ 'current-user': isCurrentUser(player) }"
          >
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score">{{ player.scores[lastHoleIdx] ?? '' }}</span>
          </div>
        </div>
      </div>
      
      <div class="scoreboard-section">
        <h6 class="section-title">Total</h6>
        <div class="player-list">
          <div 
            v-for="player in sortedPlayers" 
            :key="player.name"
            class="player-row"
            :class="{ 'current-user': isCurrentUser(player) }"
          >
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score total-score">{{ player.total }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Desktop full view -->
    <div v-else class="scoreboard-desktop">
      <div class="table-responsive">
        <table class="table table-bordered scoreboard-table">
          <thead>
            <tr>
              <th class="player-header">Player</th>
              <th v-for="h in completedHoles" :key="h" class="hole-header">Hole {{ h }}</th>
              <th class="total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="player in sortedPlayers" 
              :key="player.name"
              :class="{ 'current-user': isCurrentUser(player) }"
            >
              <td class="player-cell">
                <div class="player-info">
                  <span class="player-name">{{ player.name }}</span>
                  <span v-if="showEmail" class="player-email">{{ player.email }}</span>
                </div>
              </td>
              <td 
                v-for="(score, idx) in player.scores.slice(0, completedHoles)" 
                :key="idx"
                class="score-cell"
              >
                {{ score }}
              </td>
              <td class="total-cell">
                <strong>{{ player.total }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-scoreboard {
  width: 100%;
  max-width: 100%;
}

.scoreboard-title {
  margin-bottom: 1rem;
  font-weight: 600;
  color: #333;
}

/* Mobile Styles */
.scoreboard-mobile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scoreboard-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.section-title {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.player-name {
  font-weight: 500;
  color: #333;
}

.player-score {
  font-weight: 600;
  color: #495057;
}

.total-score {
  color: #28a745;
}

/* Desktop Styles */
.scoreboard-desktop {
  width: 100%;
  overflow-x: auto;
}

.scoreboard-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.scoreboard-table th,
.scoreboard-table td {
  padding: 0.5rem;
  text-align: center;
  border: 1px solid #dee2e6;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-header {
  width: 120px;
  text-align: left;
}

.hole-header {
  width: 60px;
  font-size: 0.8rem;
}

.total-header {
  width: 80px;
  font-weight: 600;
}

.player-cell {
  text-align: left;
  padding: 0.75rem 0.5rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 500;
  color: #333;
}

.player-email {
  font-size: 0.75rem;
  color: #6c757d;
}

.score-cell {
  font-weight: 500;
}

.total-cell {
  font-weight: 600;
  background: #f8f9fa;
}

/* Current user highlighting */
.current-user {
  background: #e6f7ff !important;
  border-color: #91d5ff !important;
}

.current-user .player-name {
  color: #1890ff;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .scoreboard-table {
    font-size: 0.8rem;
  }
  
  .player-header {
    width: 80px;
  }
  
  .hole-header {
    width: 50px;
    font-size: 0.7rem;
  }
  
  .total-header {
    width: 60px;
  }
  
  .player-cell {
    padding: 0.5rem 0.25rem;
  }
}
</style> 