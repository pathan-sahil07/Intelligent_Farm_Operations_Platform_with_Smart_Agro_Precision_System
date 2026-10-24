import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../constants/routes.constants'

function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Page not found</p>
      <h1 className="page-title">This field is off the map.</h1>
      <p className="page-description">The page you requested does not exist in this workspace.</p>
      <Link className="button button-primary" to={APP_ROUTES.dashboard}>
        Return to overview
      </Link>
    </main>
  )
}

export default NotFound