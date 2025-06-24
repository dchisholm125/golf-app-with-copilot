// src/services/profileStats.ts
// Business logic for user golf statistics and game management
import { ref } from 'vue'

const stats = ref({
  gamesPlayed: 12, // Placeholder values
  gamesWon: 7,
  gamesLost: 5,
})

function startNewGame() {
  // Placeholder: Add logic to start a new game
  alert('Starting a new game! (Feature coming soon)')
}

export function useProfileStats() {
  return { stats, startNewGame }
}
