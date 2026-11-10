import { zodResolver } from '@hookform/resolvers/zod'
import { Wheat } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'
import { errorMessage } from '@/lib/axios'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-gradient-to-br from-brand-50 to-soil-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-7 shadow-lg">
        <div className="mb-5 flex items-center gap-2 text-brand-700">
          <Wheat aria-hidden="true" />
          <span className="font-semibold">Intelligent Farm Operations</span>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="mt-1 mb-5 text-sm text-neutral-500">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      await login(values.email, values.password)
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  })

  return (
    <AuthShell title="Sign in" subtitle="Welcome back. Sign in to manage your farm operations.">
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" className="field-control" aria-invalid={errors.email ? true : undefined} {...register('email')} />
          {errors.email && <span className="field-error" role="alert">{errors.email.message}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="field-control" aria-invalid={errors.password ? true : undefined} {...register('password')} />
          {errors.password && <span className="field-error" role="alert">{errors.password.message}</span>}
        </div>
        {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-500">
        New here? <Link to="/register" className="font-medium text-brand-700 underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(150),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().max(40).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['FARM_OWNER', 'FIELD_WORKER']),
})
type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'FARM_OWNER' } })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      await signUp({ ...values, phone: values.phone || undefined })
      navigate('/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  })

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', auto: 'name' },
    { name: 'email', label: 'Email', type: 'email', auto: 'email' },
    { name: 'phone', label: 'Phone (optional)', type: 'tel', auto: 'tel' },
    { name: 'password', label: 'Password', type: 'password', auto: 'new-password' },
  ] as const

  return (
    <AuthShell title="Create your account" subtitle="Farm owners manage farms. Field workers are assigned to farms by an owner.">
      <form onSubmit={onSubmit} noValidate>
        {fields.map((f) => (
          <div className="field" key={f.name}>
            <label className="field-label" htmlFor={f.name}>{f.label}</label>
            <input id={f.name} type={f.type} autoComplete={f.auto} className="field-control" aria-invalid={errors[f.name] ? true : undefined} {...register(f.name)} />
            {errors[f.name] && <span className="field-error" role="alert">{errors[f.name]?.message}</span>}
          </div>
        ))}
        <div className="field">
          <label className="field-label" htmlFor="role">I am a</label>
          <select id="role" className="field-control" {...register('role')}>
            <option value="FARM_OWNER">Farm owner</option>
            <option value="FIELD_WORKER">Field worker</option>
          </select>
        </div>
        {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-500">
        Already registered? <Link to="/login" className="font-medium text-brand-700 underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}
