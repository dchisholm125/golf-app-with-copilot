<script lang="ts">
import { defineComponent, onMounted, ref, computed } from 'vue'
import { useCurrentUser } from '../composables/useCurrentUser'
import { fetchUserGameHistory, getPlayersForGame } from '../services/gameService'
import { useAuth0 } from '@auth0/auth0-vue'
import { useDbUser } from '../composables/useDbUser'

export default defineComponent({
  name: 'GameHistory',
  setup() {
    const games = ref<any[]>([])
    const historyLoading = ref(true)
    const playerLists = ref<Record<number, any>>({})
    const { isAuthenticated } = useCurrentUser()
    const { user } = useAuth0()
    const userEmail = computed(() => user.value?.email || '')
    // Use the new composable
    const { dbUser, fetchDbUser } = useDbUser()

    onMounted(async () => {
      await fetchDbUser()
      if (isAuthenticated.value && dbUser.value?.id) {
        games.value = await fetchUserGameHistory(dbUser.value.id)
        // For each game, fetch the player list if it's a wolf game
        for (const game of games.value) {
          if (game.type === 'wolf') {
            playerLists.value[game.id] = await getPlayersForGame(game.id)
          }
        }
      }
      historyLoading.value = false
    })

    function formatDate(dateStr: string): string {
      const d = new Date(dateStr)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${mm}/${dd}/${yyyy}`
    }

    function sum(arr: number[] | undefined): number | '' {
      return Array.isArray(arr) && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : ''
    }

    return { games, historyLoading, playerLists, userEmail, formatDate, sum }
  }
})
</script>

<template>
  <div class="game-history">
    <h1>Game History</h1>
    <div v-if="historyLoading">Loading...</div>
    <div v-else>
      <div v-if="games.length === 0">No games found.</div>
      <div v-else>
        <div v-for="game in games" :key="game.id" class="game-history-scorecard">
          <div class="game-history-header">
            <strong>{{ game.type.toUpperCase() }} - Game #{{ game.id }} - {{ formatDate(game.date) }}</strong>
          </div>
          <table class="scorecard-table" v-if="game.type === 'wolf' && playerLists[game.id]">
            <thead>
              <tr>
                <th>Player</th>
                <th v-for="(_, idx) in game.points" :key="'hole-' + idx">Hole {{ idx + 1 }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in playerLists[game.id]" :key="player.email"
                  :class="{ 'highlight-row': player.email === userEmail }">
                <td class="row-label">{{ player.name }}</td>
                <td v-for="(_, idx) in game.points" :key="'wolf-' + idx">
                  {{ Array.isArray(player.points) ? player.points[idx] : '' }}
                </td>
                <td>
                  <strong>{{ sum(player.points) }}</strong>
                </td>
              </tr>
              <!-- Buffer row -->
              <tr class="buffer-row"><td :colspan="game.points.length + 2"></td></tr>
              <!-- User's strokes row -->
              <tr class="user-strokes-row highlight-row">
                <td class="row-label">Your Strokes</td>
                <td v-for="(_, idx) in game.strokes" :key="'stroke-' + idx">
                  {{ Array.isArray(playerLists[game.id]) ? (playerLists[game.id].find((p: any) => p.email === userEmail)?.strokes?.[idx] ?? '') : '' }}
                </td>
                <td>
                  <strong>{{ sum(playerLists[game.id]?.find((p: any) => p.email === userEmail)?.strokes) }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="scorecard-table" v-else>
            <thead>
              <tr>
                <th></th>
                <th v-for="(_, idx) in game.points" :key="'hole-' + idx">Hole {{ idx + 1 }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-label">Wolf</td>
                <td v-for="(point, idx) in game.points" :key="'wolf-' + idx">{{ point }}</td>
                <td><strong>{{ sum(game.points) }}</strong></td>
              </tr>
              <tr>
                <td class="row-label">Strokes</td>
                <td v-for="(stroke, idx) in game.strokes" :key="'stroke-' + idx">{{ stroke }}</td>
                <td><strong>{{ sum(game.strokes) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-history {
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 2rem;
}
.game-history-scorecard {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafbfc;
}
.game-history-header {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}
.scorecard-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
}
.scorecard-table th,
.scorecard-table td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: center;
}
.row-label {
  font-weight: bold;
  background: #f0f4f8;
}
.current-user {
  font-weight: bold;
  color: #42b983;
}
.highlight-row {
  background: #e6f7ff !important;
}
.buffer-row {
  height: 0.5rem;
  background: transparent;
  border: none;
}
.user-strokes-row {
  font-weight: bold;
  color: #d9534f;
}
</style>
