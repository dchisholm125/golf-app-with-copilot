import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import GameSelect from '../views/GameSelect.vue'
import WolfGame from '../views/WolfGame.vue'
import GameHistory from '../views/GameHistory.vue'
import SkinsGame from '../views/SkinsGame.vue'
import Leaderboards from '../views/Leaderboards.vue'
import Achievements from '../views/Achievements.vue'
// import SixSixSixGame from '../views/SixSixSixGame.vue' // To be created
import { useAuth0 } from '@auth0/auth0-vue'
import { watch } from 'vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/game-select', name: 'GameSelect', component: GameSelect, meta: { requiresAuth: true } },
  { path: '/wolf/:gameId', name: 'WolfGame', component: WolfGame, meta: { requiresAuth: true, gameType: 'wolf' }, props: true },
  { path: '/skins/:gameId', name: 'SkinsGame', component: SkinsGame, meta: { requiresAuth: true, gameType: 'skins' }, props: true },
  { path: '/history', name: 'GameHistory', component: GameHistory, meta: { requiresAuth: true } },
  // { path: '/sixsixsix/:gameId', name: 'SixSixSixGame', component: SixSixSixGame, meta: { requiresAuth: true, gameType: 'sixsixsix' }, props: true },
  {
    path: '/profile/games-won',
    name: 'GamesWon',
    component: () => import('../views/GamesWon.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/games-lost',
    name: 'GamesLost',
    component: () => import('../views/GamesLost.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/game-complete/:gameType/:gameId',
    name: 'GameComplete',
    component: () => import('../views/GameComplete.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leaderboards',
    name: 'Leaderboards',
    component: Leaderboards,
    meta: { requiresAuth: true },
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: Achievements,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Route guard to require authentication
router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: Function) => {
  const auth0 = useAuth0()
  if (to.meta.requiresAuth) {
    if (!auth0.isAuthenticated.value && !auth0.isLoading.value) {
      auth0.loginWithRedirect({ appState: { targetUrl: to.fullPath } })
    } else if (auth0.isLoading.value) {
      const stop = watch(auth0.isLoading, (val) => {
        if (!val) {
          stop()
          if (!auth0.isAuthenticated.value) {
            auth0.loginWithRedirect({ appState: { targetUrl: to.fullPath } })
          } else {
            next()
          }
        }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
