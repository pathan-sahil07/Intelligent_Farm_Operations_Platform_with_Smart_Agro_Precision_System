import { useId } from 'react'
import type { InputProps } from './Input.types'

export function Input({ id, label, error, className = '', ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input
        {...props}
        id={inputId}
        className={`field-control ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </label>
  )
}
