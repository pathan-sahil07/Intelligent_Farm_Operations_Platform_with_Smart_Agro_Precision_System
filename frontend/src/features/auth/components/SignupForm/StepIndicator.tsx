import type { FC } from 'react'
import { Check, ShieldCheck, User } from 'lucide-react'
import type { RegistrationPhase } from '../../types/registration.types'
import { AUTH_TRANSLATIONS, type AppLanguage } from '../../utils/language'

interface StepIndicatorProps {
  currentPhase: RegistrationPhase
  completedPhases: Set<RegistrationPhase>
  onSelectPhase: (phase: RegistrationPhase) => void
  lang: AppLanguage
}

interface StepMeta {
  phase: RegistrationPhase
  titleKey: keyof (typeof AUTH_TRANSLATIONS)['en']
  subKey: keyof (typeof AUTH_TRANSLATIONS)['en']
  icon: typeof User
}

const STEPS: StepMeta[] = [
  { phase: 1, titleKey: 'phase1Title', subKey: 'phase1Sub', icon: ShieldCheck },
  { phase: 2, titleKey: 'phase2Title', subKey: 'phase2Sub', icon: User },
]

export const StepIndicator: FC<StepIndicatorProps> = ({
  currentPhase,
  completedPhases,
  onSelectPhase,
  lang,
}) => {
  const t = AUTH_TRANSLATIONS[lang]

  return (
    <nav aria-label="Registration Progress" className="fv-stepper">
      <ol className="fv-stepper-list" role="list">
        {STEPS.map((step, idx) => {
          const isCurrent = currentPhase === step.phase
          const isCompleted = completedPhases.has(step.phase)
          const isClickable = isCompleted || step.phase < currentPhase
          const Icon = step.icon

          let statusClass = 'upcoming'
          if (isCurrent) statusClass = 'current'
          else if (isCompleted) statusClass = 'completed'

          return (
            <li
              key={step.phase}
              className={`fv-stepper-item ${statusClass}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {idx > 0 && (
                <div
                  className={`fv-stepper-line ${completedPhases.has((step.phase - 1) as RegistrationPhase) ? 'active' : ''}`}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                className="fv-stepper-btn"
                disabled={!isClickable && !isCurrent}
                onClick={() => {
                  if (isClickable) onSelectPhase(step.phase)
                }}
                aria-label={`Step ${step.phase}: ${String(t[step.titleKey])}`}
              >
                <span className="fv-stepper-icon-wrap" aria-hidden="true">
                  {isCompleted && !isCurrent ? (
                    <Check size={14} strokeWidth={3} className="fv-check-icon" />
                  ) : (
                    <Icon size={14} className="fv-step-icon" />
                  )}
                  <span className="fv-stepper-num">{step.phase}</span>
                </span>

                <span className="fv-stepper-text">
                  <span className="fv-stepper-title">{String(t[step.titleKey])}</span>
                  <span className="fv-stepper-sub">{String(t[step.subKey])}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
