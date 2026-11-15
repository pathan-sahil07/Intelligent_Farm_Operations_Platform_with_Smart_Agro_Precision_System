import type { CardProps } from './Card.types'

export function Card({ children, className = '', padding = true, ...props }: CardProps) {
  return (
    <section
      {...props}
      className={`ui-card ${padding ? 'ui-card-padding' : ''} ${className}`.trim()}
    >
      {children}
    </section>
  )
}
