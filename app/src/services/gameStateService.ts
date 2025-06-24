// src/services/gameStateService.ts
// Service for saving and loading game state from the backend
import axios from 'axios'

export interface GameState {
  current_hole: number
  state_json: any
}

export async function saveGameState(gameId: number, state: GameState) {
  await axios.patch(`/api/games/${gameId}/state`, state)
}

export async function loadGameState(gameId: number): Promise<GameState> {
  const res = await axios.get(`/api/games/${gameId}/state`)
  console.log('[gameStateService] loadGameState response:', res.data)
  return res.data
}
