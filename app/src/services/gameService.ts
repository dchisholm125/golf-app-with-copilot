// src/services/gameService.ts
// Service for interacting with the backend game endpoints
// Thoroughly documented and beginner-friendly

import axios from 'axios'
import { API_BASE_URL } from '../config'

const api = axios.create({ baseURL: API_BASE_URL })

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
  const response = await api.post('/games/', data)
  return response.data
}

/**
 * Fetch the list of players for a given game from the backend.
 * @param gameId The ID of the game
 * @returns Array of Player objects
 */
export async function getPlayersForGame(gameId: number): Promise<Player[]> {
  const response = await api.get(`/games/${gameId}/players`)
  return response.data
}
