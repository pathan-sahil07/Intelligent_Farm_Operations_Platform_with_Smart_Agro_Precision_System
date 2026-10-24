import { Bell, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

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
        <span className="topbar-date">{today}</span>
      </div>
      <div className="topbar-actions">
        <span className="tag">
          <span aria-hidden="true" className="activity-dot" />
          Demo workspace
        </span>
        <button
          aria-label="Notifications are not connected"
          className="icon-button"
          title="Notifications are not connected"
          type="button"
        >
          <Bell aria-hidden="true" size={16} />
        </button>
        <div className="user-chip">
          <span aria-hidden="true" className="user-avatar">
            FS
          </span>
          <span className="user-details">
            <span className="user-name">Farm manager</span>
            <span className="user-role">Local demo</span>
          </span>
        </div>
      </div>
    </header>
  )
}
