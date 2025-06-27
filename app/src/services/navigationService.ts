import { useRouter } from 'vue-router'

export class NavigationService {
  private router = useRouter()
  
  // Profile and home navigation
  goToProfile() {
    this.router.push({ name: 'Profile' })
  }
  
  goToHome() {
    this.router.push({ name: 'Profile' })
  }
  
  goToGameSelect() {
    this.router.push({ name: 'GameSelect' })
  }
  
  goToGameHistory() {
    this.router.push({ name: 'GameHistory' })
  }
  
  // Game-specific navigation
  goToWolfGame(gameId: number) {
    this.router.push({ name: 'WolfGame', params: { gameId } })
  }
  
  goToSkinsGame(gameId: number) {
    this.router.push({ name: 'SkinsGame', params: { gameId } })
  }
  
  goToGameComplete(gameType: string, gameId: number) {
    this.router.push({ name: 'GameComplete', params: { gameType, gameId } })
  }
  
  // Utility navigation
  goToCurrentGame(gameId: number, gameType: string = 'wolf') {
    if (gameType === 'wolf') {
      this.goToWolfGame(gameId)
    } else if (gameType === 'skins') {
      this.goToSkinsGame(gameId)
    }
  }
  
  // External navigation
  logout(returnUrl?: string) {
    const logoutUrl = returnUrl || window.location.origin
    window.location.href = logoutUrl
  }
}

// Composable wrapper for easier use in components
export function useNavigation() {
  return new NavigationService()
} 