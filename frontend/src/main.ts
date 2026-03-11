import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { registerNotifications } from '@/plugins/notifications'

const app = createApp(App)

app.use(createPinia())
app.use(router)
registerNotifications(app)

app.mount('#app')
