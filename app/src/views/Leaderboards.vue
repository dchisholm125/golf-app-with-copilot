<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useDbUser } from '../composables/useDbUser'

const { isAuthenticated } = useCurrentUser()
const { dbUser, fetchDbUser } = useDbUser()

const leaderboards = ref<any>({})
const loading = ref(true)
const selectedType = ref('all_time')
const selectedGameType = ref('all')
const error = ref<string | null>(null)

const leaderboardTypes = [
  { value: 'all_time', label: 'All Time' },
  { value: 'monthly', label: 'This Month' },
  { value: 'weekly', label: 'This Week' }
]

const gameTypes = [
  { value: 'all', label: 'All Games' },
  { value: 'wolf', label: 'Wolf' },
  { value: 'skins', label: 'Skins' }
]

const currentLeaderboard = computed(() => {
  const key = `${selectedType.value}_${selectedGameType.value}`
  return leaderboards.value[key] || { entries: [] }
})

async function fetchLeaderboard(type: string, gameType: string) {
  try {
    const gameTypeParam = gameType === 'all' ? '' : `?game_type=${gameType}`
    const response = await fetch(`/api/leaderboards/${type}${gameTypeParam}`)
    if (!response.ok) {
      // Gracefully handle 404 or other HTTP errors without scary console output
      if (response.status === 404) {
        return { entries: [] }
      }
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (e) {
    // Only log if it's not a network connectivity issue or expected API unavailability
    if (e instanceof TypeError && e.message.includes('fetch')) {
      // Network error - API might be down, this is expected during development
      return { entries: [] }
    }
    // Log other unexpected errors more quietly
    console.warn('Leaderboard data temporarily unavailable:', e instanceof Error ? e.message : 'Unknown error')
    return { entries: [] }
  }
}

async function loadLeaderboards() {
  loading.value = true
  error.value = null
  
  try {
    await fetchDbUser()
    
    // Fetch all combinations
    for (const type of leaderboardTypes) {
      for (const gameType of gameTypes) {
        const key = `${type.value}_${gameType.value}`
        leaderboards.value[key] = await fetchLeaderboard(type.value, gameType.value)
      }
    }
  } catch (e) {
    // Only show user-friendly error message, avoid scary console output
    if (e instanceof TypeError && e.message.includes('fetch')) {
      error.value = 'Unable to connect to server. Please check your connection.'
    } else {
      error.value = 'Leaderboard data is temporarily unavailable.'
    }
    console.warn('Leaderboards temporarily unavailable:', e instanceof Error ? e.message : 'Unknown error')
  } finally {
    loading.value = false
  }
}

function isCurrentUser(userId: number): boolean {
  return dbUser.value?.id === userId
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈' 
  if (rank === 3) return '🥉'
  return `#${rank}`
}

onMounted(() => {
  if (isAuthenticated.value) {
    loadLeaderboards()
  }
})
</script>

<template>
  <div class="leaderboards">
    <div class="container">
      <h1 class="page-title">🏆 Leaderboards</h1>
      
      <!-- Filters -->
      <div class="filters mb-4">
        <div class="row">
          <div class="col-md-6">
            <label class="form-label">Time Period</label>
            <select v-model="selectedType" class="form-select" @change="loadLeaderboards">
              <option v-for="type in leaderboardTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Game Type</label>
            <select v-model="selectedGameType" class="form-select" @change="loadLeaderboards">
              <option v-for="gameType in gameTypes" :key="gameType.value" :value="gameType.value">
                {{ gameType.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading leaderboards...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-warning d-flex align-items-center">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <div>
          <strong>Heads up!</strong> {{ error }}
          <br>
          <small class="text-muted">Try refreshing the page or check back later.</small>
        </div>
      </div>

      <!-- Leaderboard -->
      <div v-else class="leaderboard-container">
        <div class="leaderboard-header">
          <h3>
            {{ leaderboardTypes.find(t => t.value === selectedType)?.label }} - 
            {{ gameTypes.find(t => t.value === selectedGameType)?.label }}
          </h3>
          <p class="text-muted mb-0" v-if="currentLeaderboard.last_updated">
            Last updated: {{ new Date(currentLeaderboard.last_updated).toLocaleString() }}
          </p>
        </div>

        <div v-if="currentLeaderboard.entries.length === 0" class="no-data">
          <p>No data available for this time period and game type.</p>
        </div>

        <div v-else class="leaderboard-table">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-dark">
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Games Won</th>
                  <th>Total Games</th>
                  <th>Win Rate</th>
                  <th>Achievement Points</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="entry in currentLeaderboard.entries" 
                  :key="entry.user_id"
                  :class="{ 'current-user-row': isCurrentUser(entry.user_id) }"
                >
                  <td class="rank-cell">
                    <span class="rank-display">{{ getRankDisplay(entry.rank) }}</span>
                  </td>
                  <td class="player-cell">
                    <strong :class="{ 'current-user-name': isCurrentUser(entry.user_id) }">
                      {{ entry.user_name }}
                    </strong>
                    <span v-if="isCurrentUser(entry.user_id)" class="you-badge">YOU</span>
                  </td>
                  <td>{{ entry.games_won }}</td>
                  <td>{{ entry.total_games }}</td>
                  <td>
                    <span class="win-rate">{{ entry.win_rate }}%</span>
                  </td>
                  <td>
                    <span class="achievement-points">{{ entry.total_achievement_points }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboards {
  min-height: 100vh;
  background: var(--bg-primary, #f8f9fa);
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary, #2c3e50);
  font-weight: 700;
}

.filters {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.filters .form-label {
  color: var(--text-primary);
  font-weight: 600;
}

.leaderboard-container {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.leaderboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.leaderboard-header h3 {
  margin: 0;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.no-data p {
  margin: 0;
  font-size: 1.1rem;
}

.leaderboard-table {
  padding: 0;
}

.table {
  margin: 0;
}

.table th {
  border-top: none;
  padding: 1rem;
  font-weight: 600;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
}

.rank-cell {
  width: 80px;
  text-align: center;
}

.rank-display {
  font-size: 1.2rem;
  font-weight: bold;
}

.player-cell {
  position: relative;
}

.current-user-row {
  background: rgba(66, 185, 131, 0.1) !important;
  border-left: 4px solid #42b983;
}

.current-user-name {
  color: #42b983;
}

.you-badge {
  background: #42b983;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
  font-weight: 600;
}

.win-rate {
  font-weight: 600;
  color: #28a745;
}

.achievement-points {
  font-weight: 600;
  color: #6f42c1;
}

@media (max-width: 768px) {
  .leaderboards {
    padding: 1rem 0;
  }
  
  .table-responsive {
    font-size: 0.9rem;
  }
  
  .table th,
  .table td {
    padding: 0.75rem 0.5rem;
  }
  
  .you-badge {
    display: block;
    margin: 0.25rem 0 0 0;
    width: fit-content;
  }
}
</style>
