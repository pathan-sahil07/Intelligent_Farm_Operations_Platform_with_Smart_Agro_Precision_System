import { AlertCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../constants/routes.constants'

interface AuthConnectionErrorScreenProps {
  onRetry: () => void
}

export function AuthConnectionErrorScreen({ onRetry }: AuthConnectionErrorScreenProps) {
  return (
    <main
      aria-live="assertive"
      role="alert"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, #15321f 0%, #0d1e13 60%, #08130b 100%)',
        color: '#e2f5e8',
        fontFamily: 'inherit',
        gap: '16px',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.16)',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
        }}
      >
        <AlertCircle size={26} color="#f87171" aria-hidden="true" />
      </div>

      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#f0fdf4',
          }}
        >
          Fieldwise
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5', fontWeight: 500, lineHeight: 1.5 }}>
          We couldn&apos;t verify your session because the authentication service is unavailable.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
        <button
          onClick={onRetry}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#08130b',
            background: '#4ade80',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            transition: 'opacity 0.15s ease',
          }}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Retry connection</span>
        </button>

        <Link
          to={APP_ROUTES.login}
          style={{ fontSize: '12px', color: '#86efac', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Go to sign in
        </Link>
      </div>
    </main>
  )
}
