import { useCurrentGameId } from '../composables/useCurrentGameId'
import { useNavigation } from './navigationService'
import { cancelGame } from './gameService'
import axios from 'axios'

export class GameManagementService {
  private currentGameId = useCurrentGameId()
  private navigation = useNavigation()
  
  // Game state management
  async restoreGameState() {
    const savedGameId = localStorage.getItem('currentGameId')
    if (!savedGameId) return false
    
    try {
      const res = await axios.get(`/api/games/${savedGameId}/state`)
      if (res.data && res.data.state_json) {
        this.currentGameId.setCurrentGameId(Number(savedGameId))
        return true
      }
    } catch (e) {
      console.log('Error verifying game with backend:', e)
      localStorage.removeItem('currentGameId')
    }
    
    return false
  }
  
  // Game cancellation
  async cancelCurrentGame(): Promise<boolean> {
    if (!this.currentGameId.currentGameId.value) return false
    
    const confirmed = window.confirm('Are you sure you want to cancel this game? This cannot be undone.')
    if (!confirmed) return false
    
    try {
      await cancelGame(this.currentGameId.currentGameId.value)
      this.currentGameId.clearCurrentGame()
      this.navigation.goToGameSelect()
      return true
    } catch (e: any) {
      // If 404, treat as already deleted and clear state
      if (e?.response?.status === 404) {
        this.currentGameId.clearCurrentGame()
        this.navigation.goToGameSelect()
        return true
      } else {
        alert('Failed to cancel game. Please try again.')
        console.error('Cancel game error:', e)
        return false
      }
    }
  }
  
  // Game completion
  async markGameComplete(gameId: number) {
    try {
      await axios.patch(`/api/games/${gameId}/complete`, { is_complete: true })
      this.currentGameId.clearCurrentGame()
    } catch (error) {
      console.error('Error marking game complete:', error)
    }
  }
  
  // Game state persistence
  persistGameId(gameId: number) {
    localStorage.setItem('currentGameId', String(gameId))
  }
  
  clearPersistedGameId() {
    localStorage.removeItem('currentGameId')
  }
  
  getPersistedGameId(): number | null {
    const saved = localStorage.getItem('currentGameId')
    return saved ? Number(saved) : null
  }
}

// Composable wrapper for easier use in components
export function useGameManagement() {
  return new GameManagementService()
} 