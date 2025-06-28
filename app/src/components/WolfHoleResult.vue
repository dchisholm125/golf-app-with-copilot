<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

interface Player {
  name: string
  email: string
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
      <label class="form-label">Who won the hole?
        <span class="info-tooltip" tabindex="0" aria-label="Wolf: 🐺, Sheep: 🐑. Wolf is the player who chose partners or went alone. Sheep are the opposing team.">🛈
          <span class="tooltip-text">Wolf: 🐺, Sheep: 🐑<br>Wolf is the player who chose partners or went alone. Sheep are the opposing team.</span>
        </span>
      </label>
      <div class="btn-group" role="group" style="max-width: 100%;">
        <!-- Wolf team button -->
        <button
          class="btn"
          :class="holeWinner === wolfPlayer.name ? 'btn-danger' : 'btn-outline-danger'"
          @click="emit('update:holeWinner', wolfPlayer.name)"
          :aria-pressed="holeWinner === wolfPlayer.name"
          :aria-label="wolfTeamLabel + (holeWinner === wolfPlayer.name ? ' selected' : '')"
        >
          🐺
        </button>
        <!-- Tie button -->
        <button
          class="btn"
          :class="holeWinner === 'Tie' ? 'btn-secondary' : 'btn-outline-secondary'"
          @click="emit('update:holeWinner', 'Tie')"
          :aria-pressed="holeWinner === 'Tie'"
          aria-label="Tie (no winner)"
        >
          Tie
        </button>
        <!-- Opposing team button -->
        <button
          v-if="loneWolf"
          class="btn"
          :class="holeWinner === 'Team' ? 'btn-success' : 'btn-outline-success'"
          @click="emit('update:holeWinner', 'Team')"
          :aria-pressed="holeWinner === 'Team'"
          :aria-label="opposingTeamLabel + (holeWinner === 'Team' ? ' selected' : '')"
        >
          {{ opposingTeamLabel }}
        </button>
        <button
          v-else
          class="btn"
          :class="holeWinner === 'OtherTeam' ? 'btn-success' : 'btn-outline-success'"
          @click="emit('update:holeWinner', 'OtherTeam')"
          :aria-pressed="holeWinner === 'OtherTeam'"
          :aria-label="opposingTeamLabel + (holeWinner === 'OtherTeam' ? ' selected' : '')"
        >
          {{ opposingTeamLabel }}
        </button>
      </div>
    </div>
    <button class="btn btn-success me-2 submit-btn" :disabled="!holeWinner" @click="emit('submit-hole')">{{ submitLabel }}</button>
  </div>
</template>

<style scoped>
.btn-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.info-tooltip {
  position: relative;
  cursor: pointer;
  display: inline-block;
  margin-left: 0.5em;
}
.info-tooltip:focus .tooltip-text,
.info-tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
.tooltip-text {
  visibility: hidden;
  opacity: 0;
  width: 220px;
  background: #333;
  color: #fff;
  text-align: left;
  border-radius: 6px;
  padding: 0.5em;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 0.2s;
  font-size: 0.95em;
  pointer-events: none;
}
.tooltip-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}
.btn:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .btn-group {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .btn-group .btn, .submit-btn {
    width: 100%;
    font-size: 1rem;
  }
}
.btn-group .btn {
  min-width: 120px;
  font-weight: 500;
}
.submit-btn {
  margin-top: 1rem;
}
</style>
