import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ApiError, toApiError } from '@/lib/axios'

export type FieldType = 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'email' | 'password'

export interface FieldDef {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number | 'any'
  placeholder?: string
  hint?: string
}

export type FormValues = Record<string, string | number | undefined>

interface Props {
  open: boolean
  title: string
  description?: string
  fields: FieldDef[]
  initial?: Record<string, unknown>
  submitLabel?: string
  onClose: () => void
  /** Resolve on success (dialog closes); reject with an ApiError to show it inside the dialog. */
  onSubmit: (values: FormValues) => Promise<unknown>
}

function toDefault(fields: FieldDef[], initial: Record<string, unknown> | undefined) {
  const out: Record<string, string> = {}
  for (const f of fields) {
    const v = initial?.[f.name]
    out[f.name] = v === null || v === undefined ? '' : String(v)
  }
  return out
}

function FormBody({ fields, initial, submitLabel, onClose, onSubmit }: Omit<Props, 'open' | 'title' | 'description'>) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({ defaultValues: toDefault(fields, initial) })
  const [formError, setFormError] = useState('')

  const submit = handleSubmit(async (raw) => {
    setFormError('')
    const values: FormValues = {}
    for (const f of fields) {
      const v = raw[f.name]
      if (v === '' || v === undefined) continue
      values[f.name] = f.type === 'number' ? Number(v) : v
    }
    try {
      await onSubmit(values)
      onClose()
    } catch (e) {
      const err = toApiError(e)
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        for (const [name, message] of Object.entries(err.fieldErrors)) setError(name, { message })
      }
      setFormError(err.message)
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      {fields.map((f) => {
        const id = `field-${f.name}`
        const error = errors[f.name]?.message
        const rules = {
          required: f.required ? `${f.label} is required` : false,
          ...(f.type === 'number'
            ? {
                validate: (v: string) => {
                  if (v === '') return true
                  const n = Number(v)
                  if (Number.isNaN(n)) return `${f.label} must be a number`
                  if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}`
                  if (f.max !== undefined && n > f.max) return `${f.label} must be at most ${f.max}`
                  return true
                },
              }
            : {}),
        }
        return (
          <div className="field" key={f.name}>
            <label className="field-label" htmlFor={id}>
              {f.label}
              {f.required && <span aria-hidden="true"> *</span>}
            </label>
            {f.type === 'select' ? (
              <select id={id} className="field-control" aria-invalid={error ? true : undefined} {...register(f.name, rules)}>
                {!f.required && <option value="">—</option>}
                {f.required && <option value="">Select…</option>}
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={id} rows={3} className="field-control" aria-invalid={error ? true : undefined} placeholder={f.placeholder} {...register(f.name, rules)} />
            ) : (
              <input
                id={id}
                className="field-control"
                type={f.type ?? 'text'}
                step={f.type === 'number' ? (f.step ?? 'any') : undefined}
                placeholder={f.placeholder}
                aria-invalid={error ? true : undefined}
                {...register(f.name, rules)}
              />
            )}
            {f.hint && !error && <span className="text-xs text-neutral-500">{f.hint}</span>}
            {error && (
              <span className="field-error" role="alert">
                {error}
              </span>
            )}
          </div>
        )
      })}
      {formError && (
        <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : (submitLabel ?? 'Save')}
        </Button>
      </div>
    </form>
  )
}

export function FormDialog({ open, title, description, fields, initial, submitLabel, onClose, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? '' : 'sr-only'}>{description ?? title}</DialogDescription>
        </DialogHeader>
        {/* remount per open/record so defaults always match the record being edited */}
        <FormBody key={`${title}-${String(initial?.id ?? 'new')}`} fields={fields} initial={initial} submitLabel={submitLabel} onClose={onClose} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}
