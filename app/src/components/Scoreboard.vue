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
}>()

onMounted(() => {
  if (props.players.length === 0) {
    console.warn('No players provided to Scoreboard component.')
  }

  console.log('Scoreboard mounted with holesPlayed:', props.holesPlayed)
})

// Always show all completed holes (at least 1 if holesPlayed > 0)
const completedHoles = computed(() => Math.max(0, props.holesPlayed))
</script>

<template>
  <div>
    <h6 v-if="title">{{ title }}</h6>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Player</th>
          <th v-for="h in completedHoles" :key="h">Hole {{ h }}</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in players" :key="player.name">
          <td>{{ player.name }}</td>
          <td v-for="(score, idx) in player.scores.slice(0, completedHoles)" :key="idx">{{ score }}</td>
          <td><strong>{{ player.scores.slice(0, completedHoles).reduce((a, b) => a + b, 0) }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
