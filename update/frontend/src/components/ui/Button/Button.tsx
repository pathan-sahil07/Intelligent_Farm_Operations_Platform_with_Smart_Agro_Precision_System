import type { ButtonProps } from './Button.types'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`button button-${variant} ${size !== 'md' ? `button-${size}` : ''} ${className}`.trim()}
    >
      {children}
    </button>
  )
}