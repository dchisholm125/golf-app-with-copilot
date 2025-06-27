<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useCurrentGameId } from '../composables/useCurrentGameId'
import { useNavigation } from '../services/navigationService'
import { useGameManagement } from '../services/gameManagementService'
import { useResponsive } from '../composables/useResponsive'

const { user, logout } = useAuth0()
const { currentGameId } = useCurrentGameId()
const navigation = useNavigation()
const gameManagement = useGameManagement()
const { isMobile } = useResponsive()

// Dropdown state for user menu
const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } })
}

function handleCancelGame() {
  gameManagement.cancelCurrentGame()
}

// Optional: Close dropdown when clicking outside
function onClickOutside(event: MouseEvent) {
  const dropdown = document.getElementById('user-dropdown-menu')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(async () => {
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
          <div v-if="currentGameId" class="badge bg-primary me-3 game-id-link" style="font-size: 1rem; cursor: pointer;" @click="navigation.goToCurrentGame(currentGameId)">
            Game ID: {{ currentGameId }}
          </div>
          <button v-if="currentGameId" class="btn btn-outline-danger nav-link ms-2" @click="handleCancelGame">
            <i class="bi bi-x-circle me-1"></i> Cancel Game
          </button>
        </template>
        <div class="dropdown ms-3" v-if="user?.picture" style="position: relative;">
          <img :src="user.picture" alt="User" width="40" height="40" class="rounded-circle dropdown-toggle" style="cursor:pointer;" @click.stop="toggleDropdown" />
          <div id="user-dropdown-menu" class="dropdown-menu dropdown-menu-end show" v-if="showDropdown" style="display:block; position:absolute; top:100%; right:0; min-width: 180px;">
            <template v-if="isMobile">
              <button class="dropdown-item" @click="navigation.goToProfile">
                <i class="bi bi-person-circle me-1"></i> Profile
              </button>
              <button v-if="currentGameId" class="dropdown-item" @click="navigation.goToCurrentGame(currentGameId)">
                <i class="bi bi-flag me-1"></i> Game ID: {{ currentGameId }}
              </button>
              <button v-if="currentGameId" class="dropdown-item text-danger" @click="handleCancelGame">
                <i class="bi bi-x-circle me-1"></i> Cancel Game
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
