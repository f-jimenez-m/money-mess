import Swal from 'sweetalert2'
import Toast, { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

export function registerNotifications(app: any) {
  app.use(Toast, { timeout: 3000 })
}

export { Swal, toast }
