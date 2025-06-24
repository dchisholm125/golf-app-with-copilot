<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

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
</script>

<template>
  <div>
    <div class="mb-2">
      <label class="form-label">Who won the hole?</label>
      <select :value="holeWinner" @change="emit('update:holeWinner', $event.target.value)" class="form-select" style="max-width: 300px;">
        <option :value="wolfPlayer.name">Wolf{{ loneWolf ? ' (Lone Wolf)' : (partnerPlayer ? ' + Partner' : '') }}</option>
        <option v-if="loneWolf" :value="'Team'">Team of 3</option>
        <option v-else :value="'OtherTeam'">Other Team</option>
        <option value="Tie">Tie (No points awarded)</option>
      </select>
    </div>
    <button class="btn btn-success me-2" @click="emit('submit-hole')">Submit Hole</button>
  </div>
</template>
