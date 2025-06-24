// src/services/gameService.ts
// Service for interacting with the backend game endpoints
// Thoroughly documented and beginner-friendly

import axios from 'axios'

export interface Player {
  name: string
  email: string
  user_id?: number | null
}

export interface GameCreateRequest {
  game_type: string
  players: Player[]
}

export interface GameCreateResponse {
  game_id: number
  message: string
}

/**
 * Create a new game in the backend.
 * @param data Game creation payload
 * @returns GameCreateResponse from backend
 */
export async function createGame(data: GameCreateRequest): Promise<GameCreateResponse> {
  // Adjust the URL if your backend is hosted elsewhere
  const response = await axios.post('/api/games/', data)
  return response.data
}
