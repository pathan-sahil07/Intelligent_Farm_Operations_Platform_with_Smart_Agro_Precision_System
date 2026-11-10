import { useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '@/api/endpoints'
import { FormDialog } from '@/components/common/FormDialog'
import { PageHeader, Panel } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/useAuth'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [dlg, setDlg] = useState<'profile' | 'password' | null>(null)
  if (!user) return null
  return (
    <>
      <PageHeader title="My profile" />
      <Panel>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Name</dt><dd className="font-medium">{user.fullName}</dd></div>
          <div><dt className="text-neutral-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-neutral-500">Phone</dt><dd className="font-medium">{user.phone ?? '—'}</dd></div>
          <div><dt className="text-neutral-500">Role</dt><dd><StatusBadge value={user.role} /></dd></div>
        </dl>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setDlg('profile')}>Edit profile</Button>
          <Button variant="secondary" onClick={() => setDlg('password')}>Change password</Button>
        </div>
      </Panel>
      <FormDialog open={dlg === 'profile'} title="Edit profile" fields={[
        { name: 'fullName', label: 'Full name', required: true },
        { name: 'phone', label: 'Phone' },
      ]} initial={{ fullName: user.fullName, phone: user.phone }} onClose={() => setDlg(null)}
        onSubmit={async (v) => { setUser(await authApi.updateProfile({ fullName: String(v.fullName), phone: v.phone ? String(v.phone) : undefined })); toast.success('Profile updated') }} />
      <FormDialog open={dlg === 'password'} title="Change password" description="At least 8 characters." fields={[
        { name: 'currentPassword', label: 'Current password', type: 'password', required: true },
        { name: 'newPassword', label: 'New password', type: 'password', required: true },
      ]} onClose={() => setDlg(null)}
        onSubmit={async (v) => { await authApi.changePassword({ currentPassword: String(v.currentPassword), newPassword: String(v.newPassword) }); toast.success('Password changed') }} />
    </>
  )
}
