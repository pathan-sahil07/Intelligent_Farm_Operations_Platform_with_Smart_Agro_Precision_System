import { useState } from 'react'
import { Globe, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FarmingJourney } from '../components/auth/FarmingJourney'
import { APP_ROUTES } from '../constants/routes.constants'
import { FivePhaseRegistration } from '../features/auth/components/SignupForm'
import {
  AUTH_TRANSLATIONS,
  getSavedLanguage,
  saveLanguage,
  type AppLanguage,
} from '../features/auth/utils/language'

export default function SignUp() {
  const [lang, setLang] = useState<AppLanguage>(getSavedLanguage)
  const t = AUTH_TRANSLATIONS[lang]

  function toggleLanguage() {
    const nextLanguage: AppLanguage = lang === 'en' ? 'hi' : 'en'
    setLang(nextLanguage)
    saveLanguage(nextLanguage)
  }

  return (
    <main className="auth-page">
      <div className="auth-lifecycle-backdrop" aria-hidden="true" />
      <div className="auth-container">
        <header className="auth-top-bar">
          <Link aria-label="FarmVerse workspace home" className="auth-brand-top" to={APP_ROUTES.dashboard}>
            <span aria-hidden="true" className="brand-mark"><Leaf size={20} /></span>
            <span>
              <span className="brand-name">{t.brandName}</span>
              <span className="brand-caption">{t.brandCaption}</span>
            </span>
          </Link>
          <button
            aria-label={lang === 'en' ? 'Switch interface to Hindi' : 'इंटरफ़ेस को अंग्रेज़ी में बदलें'}
            className="auth-lang-btn"
            onClick={toggleLanguage}
            type="button"
          >
            <Globe aria-hidden="true" size={14} />
            <span>{t.switchLang}</span>
          </button>
        </header>

        <div className="auth-split">
          <div className="auth-journey-col">
            <FarmingJourney lang={lang} />
          </div>
          <div className="auth-form-col">
            <FivePhaseRegistration lang={lang} />
          </div>
        </div>
      </div>
    </main>
  )
}
