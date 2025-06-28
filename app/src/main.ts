import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupAuth0 } from './auth/auth0'
import router from './router'

// Initialize dark mode before app mounts
function initializeDarkMode() {
  const saved = localStorage.getItem('darkMode')
  const isDark = saved !== null ? saved === 'true' : true // Default to dark mode
  
  if (isDark) {
    document.documentElement.classList.add('dark-mode')
    document.body.classList.add('dark-mode')
  }
  
  // Save the preference if it doesn't exist
  if (saved === null) {
    localStorage.setItem('darkMode', 'true')
  }
}

// Apply dark mode immediately
initializeDarkMode()

const app = createApp(App)
setupAuth0(app)
app.use(router)
app.mount('#app')
