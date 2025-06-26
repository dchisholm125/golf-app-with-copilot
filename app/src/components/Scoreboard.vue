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
    <table class="table table-bordered scoreboard-table">
      <thead>
        <tr>
          <th>Player</th>
          <th v-if="mobileCondensed && completedHoles">Last Hole</th>
          <th v-else v-for="h in completedHoles" :key="h">Hole {{ h }}</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in players" :key="player.name">
          <td>{{ player.name }}</td>
          <td v-if="mobileCondensed && completedHoles">
            {{ player.scores[lastHoleIdx] ?? '' }}
          </td>
          <template v-else>
            <td v-for="(score, idx) in player.scores.slice(0, completedHoles)" :key="idx">{{ score }}</td>
          </template>
          <td><strong>{{ player.scores.slice(0, completedHoles).reduce((a, b) => a + b, 0) }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.scoreboard-wrapper {
  width: 100%;
  max-width: 100vw;
  overflow-x: auto;
}
.scoreboard-table {
  min-width: 320px;
  max-width: 100vw;
  overflow-x: auto;
}
@media (max-width: 600px) {
  .scoreboard-table, .scoreboard-wrapper {
    max-width: 100vw;
    overflow-x: auto;
    font-size: 0.95rem;
  }
}
</style>
