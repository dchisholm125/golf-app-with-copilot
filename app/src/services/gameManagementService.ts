import { useCurrentGameId } from '../composables/useCurrentGameId'
import { useNavigation } from './navigationService'
import { cancelGame, fetchUserGameHistory } from './gameService'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useDbUser } from '../composables/useDbUser'
import axios from 'axios'

export class GameManagementService {
  private currentGameId = useCurrentGameId()
  private navigation = useNavigation()
  private currentUser = useCurrentUser()
  private dbUser = useDbUser()
  
  // Game state management
  async restoreGameState() {
    const savedGameId = localStorage.getItem('currentGameId')
    if (!savedGameId) return false
    
    try {
      const res = await axios.get(`/api/games/${savedGameId}/state`)
      if (res.data && res.data.state_json) {
        // Check if the game is completed
        if (res.data.state_json.isComplete) {
          // Game is completed, clear the current game
          this.currentGameId.clearCurrentGame()
          return false
        }
        
        this.currentGameId.setCurrentGameId(Number(savedGameId))
        this.currentGameId.setCurrentGameType(res.data.game_type || 'wolf')
        return true
      }
    } catch (e) {
      console.log('Error verifying game with backend:', e)
      localStorage.removeItem('currentGameId')
    }
    
    return false
  }

  // Get user's most recent active game
  async getMostRecentActiveGame() {
    if (!this.currentUser.isAuthenticated.value || !this.dbUser.dbUser.value?.id) {
      return null
    }

    try {
      const games = await fetchUserGameHistory(this.dbUser.dbUser.value.id)
      
      // Filter for active games (not completed) and sort by date
      const activeGames = games
        .filter(game => !game.is_complete)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      return activeGames.length > 0 ? activeGames[0] : null
    } catch (error) {
      console.error('Error fetching recent games:', error)
      return null
    }
  }

  // Update current game to most recent active game
  async updateToMostRecentGame() {
    const recentGame = await this.getMostRecentActiveGame()
    
    if (recentGame) {
      this.currentGameId.setCurrentGameId(recentGame.id)
      this.currentGameId.setCurrentGameType(recentGame.type)
      return recentGame
    } else {
      this.currentGameId.clearCurrentGame()
      return null
    }
  }

  // Smart navigation to current game
  async goToCurrentGame() {
    // First try to use the current game ID
    if (this.currentGameId.currentGameId.value && this.currentGameId.currentGameType.value) {
      this.navigation.goToCurrentGame(
        this.currentGameId.currentGameId.value, 
        this.currentGameId.currentGameType.value
      )
      return
    }

    // If no current game, try to find the most recent active game
    const recentGame = await this.updateToMostRecentGame()
    if (recentGame) {
      this.navigation.goToCurrentGame(recentGame.id, recentGame.type)
    } else {
      // No active games, go to game selection
      this.navigation.goToGameSelect()
    }
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