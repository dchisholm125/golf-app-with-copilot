<script setup lang="ts">
import { defineProps } from 'vue'

interface Player {
  name: string
  scores: number[]
}

const props = defineProps<{
  wolfPlayer: Player
  partnerPlayer: Player | null
  nonWolfPlayers: Player[]
  loneWolf: boolean
}>()
</script>

<template>
  <div>
    <div v-if="loneWolf">
      <p><strong>{{ wolfPlayer.name }}</strong> is going <span class="text-danger">Lone Wolf</span>!</p>
      <p>Teams: <strong>{{ wolfPlayer.name }}</strong> vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
    </div>
    <div v-else>
      <p>Teams: <strong>{{ wolfPlayer.name }}</strong><span v-if="partnerPlayer"> + {{ partnerPlayer.name }}</span> vs {{ nonWolfPlayers.map(p => p.name).join(', ') }}</p>
    </div>
  </div>
</template>
