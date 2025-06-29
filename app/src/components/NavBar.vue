<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useCurrentGameId } from '../composables/useCurrentGameId'
import { useNavigation } from '../services/navigationService'
import { useGameManagement } from '../services/gameManagementService'
import { useResponsive } from '../composables/useResponsive'
import { useDarkMode } from '../composables/useDarkMode'

const { user, logout } = useAuth0()
const { currentGameId, currentGameType } = useCurrentGameId()
const navigation = useNavigation()
const gameManagement = useGameManagement()
const { isMobile } = useResponsive()
const { isDarkMode, toggleDarkMode, initializeDarkMode } = useDarkMode()

// Dropdown state for user menu
const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleLogout() {
  // Clear all localStorage items before Auth0 logout
  clearAllLocalStorage()
  
  // Perform Auth0 logout
  logout({ logoutParams: { returnTo: window.location.origin } })
}

function clearAllLocalStorage() {
  // Clear app-specific localStorage items
  localStorage.removeItem('currentGameId')
  
  // Clear all Auth0-related localStorage items
  const auth0Keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes('@@auth0spajs@@')) {
      auth0Keys.push(key)
    }
  }
  
  // Remove all Auth0 keys
  auth0Keys.forEach(key => {
    localStorage.removeItem(key)
  })
  
  // Also clear any other potential Auth0 keys
  const allKeys = Object.keys(localStorage)
  allKeys.forEach(key => {
    if (key.includes('auth0') || key.includes('Auth0')) {
      localStorage.removeItem(key)
    }
  })
  
  console.log('Cleared all localStorage items for complete logout')
}

function handleCancelGame() {
  gameManagement.cancelCurrentGame()
}

// Smart navigation to current game
async function handleGameIdClick() {
  await gameManagement.goToCurrentGame()
}

// Optional: Close dropdown when clicking outside
function onClickOutside(event: MouseEvent) {
  const dropdown = document.getElementById('user-dropdown-menu')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(async () => {
  // Initialize dark mode
  initializeDarkMode()
  
  // Try to restore game state on mount
  await gameManagement.restoreGameState()
  
  // Add click outside listener
  document.addEventListener('click', onClickOutside)
})

// Clean up event listener
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})

// Watch for game ID changes and persist to localStorage
watch(currentGameId, (val) => {
  if (val) {
    gameManagement.persistGameId(val)
  } else {
    gameManagement.clearPersistedGameId()
  }
})
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container-fluid justify-content-between align-items-center">
      <div class="d-flex align-items-center flex-grow-1 justify-content-center position-relative">
        <a class="navbar-brand mx-auto d-flex align-items-center justify-content-center" href="#" @click.prevent="navigation.goToHome" style="position: absolute; left: 50%; transform: translateX(-50%);">
          <img src="/assets/golf-games.png" alt="Logo" height="60" class="me-2 logo-img" />
        </a>
      </div>
      <div class="d-flex align-items-center ms-auto profile-section">
        <template v-if="!isMobile">
          <button class="btn btn-outline-primary nav-link profile-btn" @click="navigation.goToProfile">
            <i class="bi bi-person-circle me-1"></i> Profile
          </button>
          <button class="btn btn-outline-secondary nav-link ms-2" @click="navigation.goToGameHistory">
            <i class="bi bi-clock-history me-1"></i> History
          </button>
          <button 
            class="btn btn-outline-secondary nav-link ms-2 dark-mode-toggle" 
            @click="toggleDarkMode"
            :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
          </button>
          <div v-if="currentGameId" class="badge bg-primary me-3 game-id-link" style="font-size: 1rem; cursor: pointer;" @click="handleGameIdClick">
            Game ID: {{ currentGameId }}
            <span v-if="currentGameType" class="ms-1 game-type-indicator">({{ currentGameType }})</span>
          </div>
          <button v-if="currentGameId" class="btn btn-outline-danger nav-link ms-2" @click="handleCancelGame">
            <i class="bi bi-x-circle me-1"></i> Cancel Game
          </button>
          <button class="btn btn-outline-success nav-link ms-2" @click="$router.push('/leaderboards')">
            <i class="bi bi-trophy me-1"></i> Leaderboards
          </button>
          <button class="btn btn-outline-warning nav-link ms-2" @click="$router.push('/achievements')">
            <i class="bi bi-award me-1"></i> Achievements
          </button>
          <button class="btn btn-outline-info nav-link ms-2" @click="$router.push('/new-round')">
            <i class="bi bi-plus-circle me-1"></i> New Round
          </button>
        </template>
        <div class="dropdown ms-3" v-if="user?.picture" style="position: relative;">
          <img :src="user.picture" alt="User" width="40" height="40" class="rounded-circle dropdown-toggle" style="cursor:pointer;" @click.stop="toggleDropdown" data-testid="user-avatar" />
          <div id="user-dropdown-menu" class="dropdown-menu dropdown-menu-end show" v-if="showDropdown" style="display:block; position:absolute; top:100%; right:0; min-width: 180px;">
            <div v-if="user?.name" class="dropdown-user-name px-3 py-2 text-center text-muted" style="font-size: 1rem; font-weight: 500; cursor: default; user-select: text;">
              {{ user.name }}
            </div>
            <hr class="dropdown-divider" />
            <template v-if="isMobile">
              <button class="dropdown-item" @click="navigation.goToProfile">
                <i class="bi bi-person-circle me-1"></i> Profile
              </button>
              <button class="dropdown-item" @click="navigation.goToGameHistory">
                <i class="bi bi-clock-history me-1"></i> History
              </button>
              <button class="dropdown-item" @click="toggleDarkMode">
                <i :class="isDarkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'" class="me-1"></i>
                {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
              </button>
              <button v-if="currentGameId" class="dropdown-item" @click="handleGameIdClick">
                <i class="bi bi-flag me-1"></i> Game ID: {{ currentGameId }}
                <span v-if="currentGameType" class="ms-1">({{ currentGameType }})</span>
              </button>
              <button v-if="currentGameId" class="dropdown-item text-danger" @click="handleCancelGame">
                <i class="bi bi-x-circle me-1"></i> Cancel Game
              </button>
              <button class="dropdown-item" @click="$router.push('/leaderboards')">
                <i class="bi bi-trophy me-1"></i> Leaderboards
              </button>
              <button class="dropdown-item" @click="$router.push('/achievements')">
                <i class="bi bi-award me-1"></i> Achievements
              </button>
              <button class="dropdown-item" @click="$router.push('/new-round')">
                <i class="bi bi-plus-circle me-1"></i> New Round
              </button>
              <hr class="dropdown-divider" />
            </template>
            <button class="dropdown-item" @click="handleLogout">Logout</button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}
.navbar-brand img.logo-img {
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  background: #fff;
  padding: 4px;
}
.profile-section {
  margin-left: auto;
  display: flex;
  align-items: center;
}
.profile-btn {
  font-weight: 600;
  border-radius: 20px;
  padding: 6px 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: background 0.2s, color 0.2s;
}
.profile-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}
.game-id-link {
  transition: all 0.2s ease;
}
.game-id-link:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.game-type-indicator {
  font-size: 0.8em;
  opacity: 0.9;
}
.dark-mode-toggle {
  transition: all 0.3s ease;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark-mode-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.dark-mode-toggle i {
  font-size: 1.1rem;
}
body {
  padding-top: 70px; /* Adjust if navbar height changes */
}
@media (max-width: 600px) {
  .navbar {
    min-width: 100vw;
    padding-left: 0;
    padding-right: 0;
  }
  .profile-section {
    margin-left: 0;
  }
  .profile-btn, .game-id-link {
    display: none !important;
  }
}
</style>
