<script setup lang="ts">
import { defineProps, computed, onMounted } from 'vue'

interface Player {
  name: string
  scores: number[]
}

const props = defineProps<{
  players: Player[]
  holesPlayed: number
  title?: string
  mobileCondensed?: boolean // If true, only show most recent hole and total
}>()

onMounted(() => {
  if (props.players.length === 0) {
    console.warn('No players provided to Scoreboard component.')
  }

  console.log('Scoreboard mounted with holesPlayed:', props.holesPlayed)
})

// Always show all completed holes (at least 1 if holesPlayed > 0)
const completedHoles = computed(() => Math.max(0, props.holesPlayed))

const lastHoleIdx = computed(() => Math.max(0, props.holesPlayed - 1))
</script>

<template>
  <div class="scoreboard-wrapper">
    <h6 v-if="title">{{ title }}</h6>
    <div v-if="mobileCondensed" class="scoreboard-mobile-tables">
      <!-- Table 1: Player & Last Hole -->
      <div class="scoreboard-table-container">
        <table class="table table-bordered scoreboard-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Last Hole</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in players" :key="player.name">
              <td class="player-name-cell">
                <span class="player-name-text">{{ player.name }}</span>
              </td>
              <td>{{ player.scores[lastHoleIdx] ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Table 2: Player & Total -->
      <div class="scoreboard-table-container mt-2">
        <table class="table table-bordered scoreboard-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in players" :key="player.name">
              <td class="player-name-cell">
                <span class="player-name-text">{{ player.name }}</span>
              </td>
              <td><strong>{{ player.scores.slice(0, completedHoles).reduce((a, b) => a + b, 0) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="scoreboard-table-container">
      <table class="table table-bordered scoreboard-table">
        <thead>
          <tr>
            <th>Player</th>
            <th v-for="h in completedHoles" :key="h">Hole {{ h }}</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.name">
            <td class="player-name-cell">
              <span class="player-name-text">{{ player.name }}</span>
            </td>
            <td v-for="(score, idx) in player.scores.slice(0, completedHoles)" :key="idx">{{ score }}</td>
            <td><strong>{{ player.scores.slice(0, completedHoles).reduce((a, b) => a + b, 0) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}
.scoreboard-table-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}
.scoreboard-table {
  min-width: 320px;
  max-width: 100%;
  overflow-x: auto;
  table-layout: auto;
}
.player-name-cell {
  max-width: 120px;
  padding: 0.25rem 0.5rem;
  overflow: hidden;
}
.player-name-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
  font-weight: 500;
}
.scoreboard-mobile-tables {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
}
@media (max-width: 600px) {
  .scoreboard-table, .scoreboard-wrapper, .scoreboard-table-container, .scoreboard-mobile-tables {
    max-width: 100%;
    overflow-x: auto;
    font-size: 0.95rem;
  }
  .player-name-cell {
    max-width: 80px;
    padding: 0.2rem 0.3rem;
  }
  .player-name-text {
    font-size: 0.95rem;
  }
}
</style>
