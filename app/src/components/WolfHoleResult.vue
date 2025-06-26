<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

interface Player {
  name: string
  scores: number[]
}

const props = defineProps<{
  wolfPlayer: Player
  partnerPlayer: Player | null
  nonWolfPlayers: Player[]
  loneWolf: boolean
  holeWinner: string
}>()

const emit = defineEmits<{
  (e: 'update:holeWinner', value: string): void
  (e: 'submit-hole'): void
}>()

const wolfTeamLabel = computed(() => {
  if (props.loneWolf) {
    return `🐺 ${props.wolfPlayer.name} 🐺`
  } else if (props.partnerPlayer) {
    return `🐺 ${props.wolfPlayer.name} & ${props.partnerPlayer.name} 🐺`
  } else {
    return `🐺 ${props.wolfPlayer.name} 🐺`
  }
})

const opposingTeamLabel = computed(() => {
  const names = props.nonWolfPlayers.map(p => p.name).join(' & ')
  return `🐑 ${names} 🐑`
})

const submitLabel = computed(() => {
  if (!props.holeWinner) {
    return 'Select a winner to continue'
  }
  if (props.holeWinner === props.wolfPlayer.name) {
    return props.loneWolf ? 'Lone Wolf Wins!' : 'Wolf Team Win'
  } else if (props.holeWinner === 'Tie') {
    return 'Hole Was Pushed'
  } else if (props.loneWolf && props.holeWinner === 'Team') {
    return 'Team of 3 Win'
  } else if (!props.loneWolf && props.holeWinner === 'OtherTeam') {
    return 'Other Team Win'
  } else {
    return 'Submit Hole'
  }
})
</script>

<template>
  <div>
    <div class="vstack mb-2">
      <label class="form-label">Who won the hole?</label>
      <div class="btn-group" role="group" style="max-width: 100%;">
        <!-- Wolf team button -->
        <button
          class="btn"
          :class="holeWinner === wolfPlayer.name ? 'btn-danger' : 'btn-outline-danger'"
          @click="emit('update:holeWinner', wolfPlayer.name)"
        >
          {{ wolfTeamLabel }}
        </button>
        <!-- Tie button -->
        <button
          class="btn"
          :class="holeWinner === 'Tie' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="emit('update:holeWinner', 'Tie')"
        >
          Tie
        </button>
        <!-- Opposing team button -->
        <button
          v-if="loneWolf"
          class="btn"
          :class="holeWinner === 'Team' ? 'btn-success' : 'btn-outline-success'"
          @click="emit('update:holeWinner', 'Team')"
        >
          {{ opposingTeamLabel }}
        </button>
        <button
          v-else
          class="btn"
          :class="holeWinner === 'OtherTeam' ? 'btn-success' : 'btn-outline-success'"
          @click="emit('update:holeWinner', 'OtherTeam')"
        >
          {{ opposingTeamLabel }}
        </button>
      </div>
    </div>
    <button class="btn btn-success me-2" :disabled="!holeWinner" @click="emit('submit-hole')">{{ submitLabel }}</button>
  </div>
</template>

<style scoped>
.btn-group .btn {
  min-width: 120px;
  font-weight: 500;
}
</style>
