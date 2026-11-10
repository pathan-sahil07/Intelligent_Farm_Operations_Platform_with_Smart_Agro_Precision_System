import { Navigate } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'

export default function InitialOwnerSetup() {
  return <Navigate replace to={APP_ROUTES.signup} />
}
