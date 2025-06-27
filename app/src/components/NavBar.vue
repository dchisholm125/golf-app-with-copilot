<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useCurrentGameId } from '../composables/useCurrentGameId'
import axios from 'axios'

const router = useRouter()
const { user, logout } = useAuth0()
const { currentGameId } = useCurrentGameId()

// Dropdown state for user menu
const showDropdown = ref(false)
const isMobile = ref(false)

function goProfile() {
  router.push({ name: 'Profile' })
}
function goHome() {
  router.push({ name: 'Profile' })
}
function logoutAndRedirect() {
  logout({ logoutParams: { returnTo: window.location.origin } })
}
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleResize() {
  isMobile.value = window.innerWidth <= 600
}

onMounted(async () => {
  console.log('[NavBar] onMounted: currentGameId', currentGameId.value)
  // Try to restore game ID from backend or localStorage
  if (!currentGameId.value) {
    // Option 1: Check localStorage for last game ID
    const savedGameId = localStorage.getItem('currentGameId')
    console.log('[NavBar] Checking localStorage for currentGameId:', savedGameId)
    if (savedGameId) {
      // Optionally, verify with backend that this game exists and is in progress
      try {
        const res = await axios.get(`/api/games/${savedGameId}/state`)
        console.log('[NavBar] Backend state for savedGameId:', res.data)
        if (res.data && res.data.state_json) {
          currentGameId.value = Number(savedGameId)
          console.log('[NavBar] Restored currentGameId from backend:', currentGameId.value)
        }
      } catch (e) {
        console.log('[NavBar] Error verifying game with backend:', e)
        // Not a valid/in-progress game, clear localStorage
        localStorage.removeItem('currentGameId')
      }
    }
  }

  handleResize()
  window.addEventListener('resize', handleResize)
})

watch(currentGameId, (val) => {
  console.log('[NavBar] currentGameId changed:', val)
  if (val) {
    localStorage.setItem('currentGameId', String(val))
  } else {
    localStorage.removeItem('currentGameId')
  }
})

// Optional: Close dropdown when clicking outside
function onClickOutside(event: MouseEvent) {
  const dropdown = document.getElementById('user-dropdown-menu')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

// Clean up event listener
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('resize', handleResize)
})

function goToCurrentGame() {
  if (currentGameId.value) {
    // Always navigate to WolfGame for now
    router.push({ name: 'WolfGame', params: { gameId: currentGameId.value } })
  }
}

function goHistory() {
  router.push({ name: 'GameHistory' })
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container-fluid justify-content-between align-items-center">
      <div class="d-flex align-items-center flex-grow-1 justify-content-center position-relative">
        <a class="navbar-brand mx-auto d-flex align-items-center justify-content-center" href="#" @click.prevent="goHome" style="position: absolute; left: 50%; transform: translateX(-50%);">
          <img src="/assets/golf-games.png" alt="Logo" height="60" class="me-2 logo-img" />
        </a>
      </div>
      <div class="d-flex align-items-center ms-auto profile-section">
        <template v-if="!isMobile">
          <button class="btn btn-outline-primary nav-link profile-btn" @click="goProfile">
            <i class="bi bi-person-circle me-1"></i> Profile
          </button>
          <button class="btn btn-outline-secondary nav-link ms-2" @click="goHistory">
            <i class="bi bi-clock-history me-1"></i> History
          </button>
          <div v-if="currentGameId" class="badge bg-primary me-3 game-id-link" style="font-size: 1rem; cursor: pointer;" @click="goToCurrentGame">Game ID: {{ currentGameId }}</div>
        </template>
        <div class="dropdown ms-3" v-if="user?.picture" style="position: relative;">
          <img :src="user.picture" alt="User" width="40" height="40" class="rounded-circle dropdown-toggle" style="cursor:pointer;" @click.stop="toggleDropdown" />
          <div id="user-dropdown-menu" class="dropdown-menu dropdown-menu-end show" v-if="showDropdown" style="display:block; position:absolute; top:100%; right:0; min-width: 180px;">
            <template v-if="isMobile">
              <button class="dropdown-item" @click="goProfile">
                <i class="bi bi-person-circle me-1"></i> Profile
              </button>
              <button v-if="currentGameId" class="dropdown-item" @click="goToCurrentGame">
                <i class="bi bi-flag me-1"></i> Game ID: {{ currentGameId }}
              </button>
              <hr class="dropdown-divider" />
            </template>
            <button class="dropdown-item" @click="logoutAndRedirect">Logout</button>
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
