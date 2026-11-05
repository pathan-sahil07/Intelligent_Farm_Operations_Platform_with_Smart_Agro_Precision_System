import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ label, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return <label className="field">{label && <span>{label}</span>}<textarea {...props} />{error && <small className="field-error">{error}</small>}</label>
}
