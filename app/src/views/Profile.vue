<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import { useProfileStats } from '../services/profileStats'
import { useRouter } from 'vue-router'
import { useCurrentGameId } from '../composables/useCurrentGameId'

const { user } = useAuth0()
const { stats } = useProfileStats()
const router = useRouter()
const { currentGameId, currentGameType, fetchCurrentGameInfo } = useCurrentGameId()

function goToGameSelect() {
  router.push({ name: 'GameSelect' })
}

async function goToContinueGame() {
  if (currentGameId.value) {
    await fetchCurrentGameInfo(currentGameId.value)
    if (currentGameType.value) {
      router.push({ path: `/${currentGameType.value}/${currentGameId.value}` })
    }
  }
}

function handleStatCardClick(stat: { title: string }) {
  if (stat.title === 'Games Won') {
    router.push('/profile/games-won')
  } else if (stat.title === 'Games Lost') {
    router.push('/profile/games-lost')
  }
}

const statCards = [
  { title: 'Games Played', value: stats.value.gamesPlayed ?? 7, textClass: '' },
  { title: 'Games Won', value: stats.value.gamesWon ?? 5, textClass: 'text-success' },
  { title: 'Games Lost', value: stats.value.gamesLost ?? 2, textClass: 'text-danger' },
]
</script>

<template>
  <div class="container py-5">
    <div class="row align-items-center mb-4">
      <div class="col-auto">
        <img :src="user?.picture" class="rounded-circle" width="80" height="80" alt="Profile" v-if="user?.picture" />
      </div>
      <div class="col">
        <h2>{{ user?.name || 'User' }}</h2>
        <p class="mb-0 text-muted">{{ user?.email }}</p>
      </div>
    </div>
    <div class="row mb-4">
      <div
        v-for="stat in statCards"
        :key="stat.title"
        class="col-md-4 d-flex align-items-stretch"
      >
        <div
          class="card text-center w-100 stat-card stat-card-clickable"
          @click="handleStatCardClick(stat)"
          :style="stat.title === 'Games Won' ? 'cursor:pointer;' : ''"
        >
          <div class="card-body d-flex flex-column justify-content-center align-items-center">
            <h5 class="card-title">{{ stat.title }}</h5>
            <p :class="['display-6', stat.textClass]">{{ stat.value }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary btn-lg"
        v-if="currentGameId"
        @click="goToContinueGame"
      >
        Continue Current Game
      </button>
      <button
        class="btn btn-primary btn-lg"
        v-else
        @click="goToGameSelect"
      >
        Start New Game
      </button>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
