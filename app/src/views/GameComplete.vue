<script setup lang="ts">
import { defineProps, onMounted } from 'vue'
import axios from 'axios'
import { useCurrentGameId } from '../composables/useCurrentGameId'

interface Player {
  name: string
  scores: number[]
}

const props = defineProps<{
  players: Player[]
  gameType: string
  gameId?: number
}>()

const { clearCurrentGame } = useCurrentGameId()

// Calculate total scores and sort for placement
const playerResults = [...props.players].map(p => ({
  ...p,
  total: p.scores.reduce((a, b) => a + b, 0)
})).sort((a, b) => b.total - a.total)

onMounted(() => {
  // Fire confetti cannons
  import('canvas-confetti').then(confetti => {
    confetti.default({
      particleCount: 100,
      angle: 75,
      spread: 45,
      startVelocity: 75,
      origin: { x: 0.1, y: 0.95 }
    })
    confetti.default({
      particleCount: 100,
      angle: 105,
      spread: 45,
      startVelocity: 75,
      origin: { x: 0.9, y: 0.95 }
    })
  })
  // Mark game as complete in backend
  if (props.gameId) {
    axios.patch(`/api/games/${props.gameId}/complete`, { is_complete: true }).catch(() => {})
  }
  // Clear current game association for this user
  clearCurrentGame()
})
</script>

<template>
  <div class="game-complete container py-5 text-center">
    <h2 class="mb-4">Congrats!</h2>
    <div id="confetti-cannon"></div>
    <p class="lead mb-4">You've completed a {{ props.gameType }} game.</p>
    <h4 class="mb-3">Final Standings</h4>
    <table class="table table-bordered w-50 mx-auto">
      <thead>
        <tr>
          <th>Place</th>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in playerResults" :key="p.name">
          <td>{{ i + 1 }}{{ ['st','nd','rd','th'][Math.min(i,3)] }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.total }}</td>
        </tr>
      </tbody>
    </table>
    <router-link to="/" class="btn btn-primary mt-4">Back to Profile</router-link>
  </div>
</template>

<style scoped>
.game-complete {
  max-width: 700px;
}
#confetti-cannon {
  min-height: 80px;
}
</style>
