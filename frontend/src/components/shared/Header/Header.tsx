import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Menu, Search, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '../../../constants/routes.constants'
import { useAuthStore } from '../../../store/useAuthStore'
import {
  AUTH_TRANSLATIONS,
  getSavedLanguage,
  saveLanguage,
  type AppLanguage,
} from '../../../features/auth/utils/language'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [lang, setLang] = useState<AppLanguage>(getSavedLanguage)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)

  const t = AUTH_TRANSLATIONS[lang]

  function toggleLanguage() {
    const nextLang: AppLanguage = lang === 'en' ? 'hi' : 'en'
    setLang(nextLang)
    saveLanguage(nextLang)
  }

  useEffect(() => {
    if (!profileMenuOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        profileButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')
    try {
      await logout()
      setProfileMenuOpen(false)
      navigate(APP_ROUTES.login, { replace: true })
    } catch {
      setLogoutError(t.errLogoutFailed)
      setIsLoggingOut(false)
    }
  }

  // Generate avatar initials from user's email or fallback
  const userEmail = user?.email || 'Farm operator'
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'FO'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          aria-label="Open navigation menu"
          className="icon-button mobile-menu-button"
          onClick={onMenuClick}
          type="button"
        >
          <Menu aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="topbar-actions">
        <label
          style={{
            width: 'min(240px, calc(100vw - 194px))',
            minWidth: 116,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px',
            border: '1px solid var(--line)',
            borderRadius: 10,
            background: 'var(--surface)',
            color: 'var(--muted)',
          }}
        >
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search farms, crops, and inventory"
            placeholder={lang === 'en' ? 'Search farms, crops, inventory...' : 'खेत, फसलें, इन्वेंट्री खोजें...'}
            style={{
              width: '100%',
              minWidth: 0,
              padding: 0,
              border: 0,
              outline: 0,
              background: 'transparent',
              color: 'var(--ink)',
              font: 'inherit',
              fontSize: 11,
            }}
            type="search"
          />
        </label>

        {/* Header Language Selector */}
        <button
          type="button"
          className="icon-button"
          onClick={toggleLanguage}
          title={lang === 'en' ? 'Switch language to Hindi' : 'अंग्रेजी भाषा चुनें'}
          aria-label={lang === 'en' ? 'Switch language to Hindi' : 'अंग्रेजी भाषा चुनें'}
          style={{ width: 'auto', padding: '0 10px', fontSize: 11, fontWeight: 650, gap: 5, display: 'inline-flex' }}
        >
          <Globe size={14} aria-hidden="true" />
          <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
        </button>

        <button
          aria-label="Notifications"
          className="icon-button"
          title="Notifications"
          type="button"
        >
          <Bell aria-hidden="true" size={16} />
        </button>

        {/* Clearly visible Logout button in the top-right area */}
        <button
          type="button"
          className="header-logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={t.logoutBtn}
          aria-label={t.logoutBtn}
        >
          <LogOut size={14} aria-hidden="true" />
          <span>{isLoggingOut ? t.loggingOutBtn : t.logoutBtn}</span>
        </button>

        {/* User Profile Chip with Dropdown */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <button
            aria-controls="profile-account-links"
            aria-expanded={profileMenuOpen}
            aria-label="User profile options"
            className="user-chip"
            onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
            ref={profileButtonRef}
            style={{
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              font: 'inherit',
              textAlign: 'left',
            }}
            type="button"
          >
            <span aria-hidden="true" className="user-avatar">
              {initials}
            </span>
            <span className="user-details">
              <span className="user-name" title={userEmail}>
                {userEmail.length > 18 ? `${userEmail.slice(0, 16)}…` : userEmail}
              </span>
              <span className="user-role">
                {lang === 'en' ? 'Active Session' : 'सक्रिय सत्र'}
              </span>
            </span>
          </button>

          <nav
            aria-label="User profile menu"
            hidden={!profileMenuOpen}
            id="profile-account-links"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              zIndex: 30,
              gap: 4,
              width: 196,
              padding: 8,
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'var(--surface)',
              boxShadow: '0 10px 28px rgba(15, 35, 18, 0.14)',
              display: profileMenuOpen ? 'grid' : 'none',
            }}
          >
            <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>
                {lang === 'en' ? 'Signed in as' : 'लॉगिन किया गया'}
              </p>
              <strong style={{ fontSize: 11, color: 'var(--ink)', wordBreak: 'break-all' }}>
                {userEmail}
              </strong>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 10px',
                border: 0,
                borderRadius: 6,
                background: '#fff2ee',
                color: '#93351d',
                fontSize: 12,
                fontWeight: 650,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              type="button"
            >
              <LogOut size={14} aria-hidden="true" />
              <span>{isLoggingOut ? t.loggingOutBtn : t.logoutBtn}</span>
            </button>
          </nav>
        </div>
      </div>

      {logoutError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 76,
            right: 20,
            zIndex: 100,
            padding: '10px 16px',
            background: '#ffebe5',
            color: '#a1472e',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            fontSize: 12,
          }}
        >
          {logoutError}
        </div>
      )}
    </header>
  )
}
