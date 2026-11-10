import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/StateViews'

export function AccessDeniedPage() {
  return (
    <div className="grid min-h-[60svh] place-items-center">
      <div className="text-center">
        <ShieldAlert className="mx-auto text-red-600" size={44} aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-semibold">Access denied</h1>
        <p className="mt-1 max-w-md text-neutral-500">Your role does not include permission to view this page. Ask an administrator if you need access.</p>
        <Link to="/" className="mt-4 inline-block font-medium text-brand-700 underline">Back to dashboard</Link>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60svh] place-items-center">
      <EmptyState title="Page not found" description="The page you are looking for does not exist." action={<Link to="/" className="font-medium text-brand-700 underline">Go to dashboard</Link>} />
    </div>
  )
}
