import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupAuth0 } from './auth/auth0'
import router from './router'

const app = createApp(App)
setupAuth0(app)
app.use(router)
app.mount('#app')
