// src/services/gameStateService.ts
// Service for saving and loading game state from the backend
import axios from 'axios'
import { API_BASE_URL } from '../config'

const api = axios.create({ baseURL: API_BASE_URL })

export interface GameState {
  current_hole: number
  state_json: any
}

export async function saveGameState(gameId: number, state: GameState) {
  await api.patch(`/games/${gameId}/state`, state)
}

export async function loadGameState(gameId: number): Promise<GameState> {
  const res = await api.get(`/games/${gameId}/state`)
  console.log('[gameStateService] loadGameState response:', res.data)
  return res.data
}
