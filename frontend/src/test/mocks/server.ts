import { setupServer } from 'msw/node'
import { authHandlers, appointmentHandlers, testResultHandlers, userHandlers } from './handlers'

export const server = setupServer(
  ...authHandlers, 
  ...appointmentHandlers, 
  ...testResultHandlers, 
  ...userHandlers
)
