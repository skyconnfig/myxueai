import { createApp } from 'vue'
import 'virtual:uno.css'
import '@/assets/styles/global.css'

import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(pinia)
app.use(router)

const authStore = useAuthStore()
void authStore.init()

app.mount('#app')
