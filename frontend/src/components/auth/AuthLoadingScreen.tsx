import { Leaf } from 'lucide-react'

export function AuthLoadingScreen() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      role="status"
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
          background: 'rgba(34, 197, 94, 0.14)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(34, 197, 94, 0.25)',
        }}
      >
        <Leaf size={26} color="#4ade80" aria-hidden="true" />
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
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: '#86efac',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          Verifying secure session...
        </p>
      </div>
    </div>
  )
}

export default AuthLoadingScreen
