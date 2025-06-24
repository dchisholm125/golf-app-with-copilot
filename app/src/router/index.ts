import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
// Add more routes as needed

const routes = [
  { path: '/', name: 'Login', component: Login },
  // { path: '/', ... } // Add home/dashboard route later
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
