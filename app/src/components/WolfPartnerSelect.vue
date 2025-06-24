<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Player {
  name: string
  scores: number[]
}

const props = defineProps<{
  players: Player[]
  wolfPlayer: Player
}>()

const emit = defineEmits<{
  (e: 'choose-partner', partner: Player): void
  (e: 'go-lone-wolf'): void
}>()
</script>

<template>
  <div class="mb-3">
    <p v-if="players.length > 1">Choose a partner for <strong>{{ wolfPlayer.name }}</strong> or go Lone Wolf:</p>
    <p v-else><strong>{{ wolfPlayer.name }}</strong> is the only player and must go Lone Wolf.</p>
    <div class="player-tile-grid">
      <button
        v-for="partner in players.filter(p => p !== wolfPlayer)"
        :key="partner.name"
        class="btn btn-outline-success btn-sm mt-2"
        @click="emit('choose-partner', partner)"
        :disabled="players.length <= 1"
      >
        <span class="fw-bold">{{ partner.name }}</span>
      </button>
    </div>
    <button class="btn btn-warning me-2 mt-2" @click="emit('go-lone-wolf')">Go Lone Wolf</button>
  </div>
</template>

<style scoped>
.player-tile-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}
.player-tile {
  width: 140px;
  transition: box-shadow 0.2s, background 0.2s;
  cursor: pointer;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e0e0e0;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}
.player-tile .fw-bold {
  white-space: pre-line;
  word-break: break-word;
  overflow-wrap: break-word;
  display: inline-block;
}
</style>
