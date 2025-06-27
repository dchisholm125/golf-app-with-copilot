<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { createGame } from '../services/gameService'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'GameCreate',
  setup() {
    const gameType = ref('wolf')
    const skinValue = ref(1)
    const players = ref([{ name: '', email: '' }])
    const creating = ref(false)
    const error = ref('')
    const success = ref('')
    const router = useRouter()

    const isSkins = computed(() => gameType.value === 'skins')

    function addPlayer() {
      players.value.push({ name: '', email: '' })
    }

    function removePlayer(idx: number) {
      if (players.value.length > 1) players.value.splice(idx, 1)
    }

    async function submit() {
      error.value = ''
      success.value = ''
      creating.value = true
      try {
        const payload: any = {
          game_type: gameType.value,
          players: players.value
        }
        if (isSkins.value) payload.skin_value = skinValue.value
        const result = await createGame(payload)
        success.value = 'Game created!'
        // Navigate to the correct game play screen
        if (isSkins.value && result?.game_id) {
          router.push({ name: 'SkinsGame', params: { gameId: result.game_id } })
        } else if (gameType.value === 'wolf' && result?.game_id) {
          router.push({ name: 'WolfGame', params: { gameId: result.game_id } })
        }
      } catch (e: any) {
        error.value = e?.message || 'Failed to create game'
      } finally {
        creating.value = false
      }
    }

    return {
      gameType, skinValue, players, isSkins, creating, error, success,
      addPlayer, removePlayer, submit
    }
  }
})
</script>

<template>
  <div class="game-create">
    <h2>Create New Game</h2>
    <form @submit.prevent="submit">
      <label>
        Game Type:
        <select v-model="gameType">
          <option value="wolf">Wolf</option>
          <option value="skins">Skins</option>
        </select>
      </label>
      <div v-if="isSkins" class="skin-value-row">
        <label>
          Skin Value:
          <input type="number" v-model.number="skinValue" min="1" step="1" required />
        </label>
      </div>
      <div class="players-section">
        <h3>Players</h3>
        <div v-for="(player, idx) in players" :key="idx" class="player-row">
          <input v-model="player.name" placeholder="Name" required />
          <input v-model="player.email" placeholder="Email" type="email" required />
          <button type="button" @click="removePlayer(idx)" v-if="players.length > 1">Remove</button>
        </div>
        <button type="button" @click="addPlayer">Add Player</button>
      </div>
      <button type="submit" :disabled="creating">Create Game</button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </form>
  </div>
</template>

<style scoped>
.game-create {
  max-width: 500px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 2rem;
}
.players-section {
  margin-top: 1rem;
}
.player-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.skin-value-row {
  margin: 1rem 0;
}
.error {
  color: #d9534f;
  margin-top: 1rem;
}
.success {
  color: #42b983;
  margin-top: 1rem;
}
</style>
