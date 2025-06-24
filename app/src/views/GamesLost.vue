<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'

const { user } = useAuth0()
const games = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!user.value?.sub) return
  try {
    const res = await axios.get(`/api/users/${encodeURIComponent(user.value.sub)}/games-lost`)
    games.value = res.data.games
  } catch (e) {
    error.value = 'Failed to load games.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <h3>Games Lost</h3>
    <button class="btn btn-secondary mb-3" @click="$router.push('/')">Back</button>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Game Type</th>
            <th>Strokes (per hole)</th>
            <th>Points (per hole)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in games" :key="game.id">
            <td>{{ game.date }}</td>
            <td>{{ game.type }}</td>
            <td>
              <span v-if="game.strokes && game.strokes.length">
                {{ game.strokes.join(', ') }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span v-if="game.points && game.points.length">
                {{ game.points.join(', ') }}
              </span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!games.length" class="text-muted">No games found.</div>
    </div>
  </div>
</template>

<style scoped>
.table {
  background: #fff;
}
</style>
