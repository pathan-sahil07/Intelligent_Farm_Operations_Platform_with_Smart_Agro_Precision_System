import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import {
  hierarchyService,
  type CurrentUser,
  type Farm,
  type FarmRole,
  type Invitation,
  type UserSummary,
} from '../features/user-management/services/hierarchyService'

const inviteRole: Partial<Record<FarmRole, FarmRole>> = {
  FARM_OWNER: 'FARM_MANAGER',
  FARM_MANAGER: 'FARMER',
  FARMER: 'FIELD_WORKER',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function UserManagement() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<UserSummary[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedInviteRole, setSelectedInviteRole] = useState<FarmRole>('FARM_MANAGER')
  const [farmIds, setFarmIds] = useState<string[]>([])
  const [fieldOrLocation, setFieldOrLocation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const role = user?.role === 'FARM_OWNER' ? selectedInviteRole : user ? inviteRole[user.role] : undefined
  const requiresName = role !== 'FARM_MANAGER'
  const canInvite = Boolean(role && user?.organizationId)
  const selectedFarmNames = useMemo(
    () => farms.filter((farm) => farmIds.includes(farm.id)).map((farm) => farm.name),
    [farmIds, farms],
  )

  useEffect(() => {
    Promise.all([
      hierarchyService.getCurrentUser(),
      hierarchyService.listFarms(),
      hierarchyService.listInvitations(),
      hierarchyService.listUsers(),
    ])
      .then(([currentUser, availableFarms, pendingInvitations, organizationMembers]) => {
        setUser(currentUser)
        setFarms(availableFarms)
        setInvitations(pendingInvitations)
        setMembers(organizationMembers)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load user management.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!role) return
    setError('')
    setNotice('')
    if (role !== 'FARM_OWNER' && !farmIds.length) {
      setError('Select at least one farm.')
      return
    }
    if (role === 'FIELD_WORKER' && farmIds.length !== 1) {
      setError('Select exactly one farm for a field worker.')
      return
    }
    if (role === 'FIELD_WORKER' && !fieldOrLocation.trim()) {
      setError('Enter the assigned field or work location.')
      return
    }

    setSubmitting(true)
    try {
      const created = await hierarchyService.createInvitation({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        role,
        farmIds,
        fieldOrLocation: role === 'FIELD_WORKER' ? fieldOrLocation.trim() : undefined,
        message: message.trim() || undefined,
      })
      setInvitations((current) => [created, ...current])
      setEmail('')
      setFullName('')
      setFarmIds([])
      setFieldOrLocation('')
      setMessage('')
      setNotice(`Invitation sent to ${created.email}.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send the invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  async function resend(invitation: Invitation) {
    setError('')
    setNotice('')
    try {
      const updated = await hierarchyService.resendInvitation(invitation.id)
      setInvitations((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`A new invitation was sent to ${updated.email}.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to resend the invitation.')
    }
  }

  async function revoke(invitation: Invitation) {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return
    setError('')
    setNotice('')
    try {
      await hierarchyService.revokeInvitation(invitation.id)
      setInvitations((current) => current.map((item) => item.id === invitation.id ? { ...item, status: 'REVOKED' } : item))
      setNotice(`Invitation for ${invitation.email} was revoked.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to revoke the invitation.')
    }
  }

  if (loading) return <p aria-busy="true">Loading members and invitations…</p>
  if (!canInvite || !role) {
    return <p role="alert">{error || 'Your role is not permitted to invite organisation members.'}</p>
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">{user?.organizationName ?? 'FarmVerse organization'}</p>
          <h1 className="page-title">People and invitations</h1>
          <p className="page-description">
            Your role ({user?.role.replaceAll('_', ' ')}) can invite {role.replaceAll('_', ' ')} accounts.
          </p>
        </div>
      </div>

      <div className="content-grid two">
        <Card>
          <h2 className="panel-title">Invite a member</h2>
          <p className="panel-subtitle">
            {user?.role === 'FARM_OWNER'
              ? 'Only a Farm Owner can authorize another Farm Owner account.'
              : 'Your invitation permissions are determined by your account role.'}
          </p>
          <form className="fv-fields-stack" onSubmit={handleInvite}>
            <Input autoComplete="email" disabled={submitting} label="Email address" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input autoComplete="name" disabled={submitting} label={`Full name${requiresName ? '' : ' (optional)'}`} name="fullName" required={requiresName} value={fullName} onChange={(event) => setFullName(event.target.value)} />
            {user?.role === 'FARM_OWNER' && (
              <label className="field">
                <span className="field-label">Authorized role</span>
                <select
                  className="field-control"
                  value={selectedInviteRole}
                  onChange={(event) => {
                    setSelectedInviteRole(event.target.value as FarmRole)
                    setFarmIds([])
                  }}
                >
                  <option value="FARM_OWNER">Farm Owner</option>
                  <option value="FARM_MANAGER">Farm Manager</option>
                </select>
                <span className="table-secondary">An additional Farm Owner must accept this invitation to receive owner permissions.</span>
              </label>
            )}
            <label className="field">
              <span className="field-label">Assigned farm(s){role === 'FARM_OWNER' ? ' (optional)' : ''}</span>
              <select
                className="field-control"
                multiple
                required={role !== 'FARM_OWNER'}
                value={farmIds}
                onChange={(event) => setFarmIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
              >
                {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
              </select>
              <span className="table-secondary">{role === 'FARM_OWNER' ? 'Farm Owners can access all organization farms.' : 'Choose only farms you are authorized to manage.'}</span>
            </label>
            {role === 'FIELD_WORKER' && (
              <Input label="Assigned field or work location" name="fieldOrLocation" required value={fieldOrLocation} onChange={(event) => setFieldOrLocation(event.target.value)} />
            )}
            <label className="field">
              <span className="field-label">Optional message</span>
              <textarea className="field-control" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            {error && <p className="auth-status error" role="alert">{error}</p>}
            {notice && <p className="auth-status success" role="status">{notice}</p>}
            <Button disabled={submitting || farms.length === 0} type="submit">
              {submitting ? 'Sending…' : `Send ${role.replaceAll('_', ' ').toLowerCase()} invitation`}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="panel-title">Invitation status</h2>
          <p className="panel-subtitle">Invitation links are sent by email and are never shown here.</p>
          {invitations.length === 0 ? (
            <p className="table-empty">No invitations yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Expires</th><th scope="col">Actions</th></tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td><span className="table-primary">{invitation.fullName || invitation.email}</span><span className="table-secondary">{invitation.email}</span></td>
                      <td>{invitation.role.replaceAll('_', ' ')}</td>
                      <td><span className={`tag ${invitation.status === 'PENDING' ? '' : 'warning'}`}>{invitation.status}</span></td>
                      <td>{formatDate(invitation.expiresAt)}</td>
                      <td>
                        {invitation.status === 'PENDING' || invitation.status === 'EXPIRED' ? (
                          <span className="content-grid two">
                            <Button onClick={() => void resend(invitation)} size="sm" type="button" variant="secondary">Resend</Button>
                            <Button onClick={() => void revoke(invitation)} size="sm" type="button" variant="danger">Revoke</Button>
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedFarmNames.length > 0 && <p className="table-secondary">Selected: {selectedFarmNames.join(', ')}</p>}
        </Card>
      </div>

      <div className="section-heading">
        <div>
          <h2>Organization members</h2>
          <p>Members and farm assignments visible to your role</p>
        </div>
      </div>
      <Card>
        {members.length === 0 ? (
          <p className="table-empty">No members are available.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Assigned farms</th><th scope="col">Field / location</th></tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td><span className="table-primary">{member.fullName}</span><span className="table-secondary">{member.email}</span></td>
                    <td>{member.role.replaceAll('_', ' ')}</td>
                    <td><span className="tag">{member.status}</span></td>
                    <td>{member.assignedFarms.map((farm) => farm.name).join(', ') || '—'}</td>
                    <td>{member.assignedFields.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
