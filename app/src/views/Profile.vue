<script setup lang="ts">
import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useProfileStats } from '../services/profileStats'
import { useRouter } from 'vue-router'
import { useCurrentGameId } from '../composables/useCurrentGameId'

const { user } = useAuth0()
const { stats } = useProfileStats()
const router = useRouter()
const { currentGameId } = useCurrentGameId()

function goToGameSelect() {
  router.push({ name: 'GameSelect' })
}
function goToContinueGame() {
  router.push({ name: 'GameSelect' })
}
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
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Games Played</h5>
            <p class="display-6">{{ stats.gamesPlayed }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Games Won</h5>
            <p class="display-6 text-success">{{ stats.gamesWon }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Games Lost</h5>
            <p class="display-6 text-danger">{{ stats.gamesLost }}</p>
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
