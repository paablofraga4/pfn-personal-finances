import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'personal-finance-hub-tracker-77pkoota',
  authRequired: false // Cambiar a false para permitir acceso sin autenticación
})