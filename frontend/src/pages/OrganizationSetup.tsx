import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { APP_ROUTES } from '../constants/routes.constants'
import {
  hierarchyService,
  type CurrentUser,
  type FarmInput,
  type Organization,
} from '../features/user-management/services/hierarchyService'

const blankFarm: FarmInput = {
  name: '',
  location: '',
  address: '',
  areaUnit: 'acre',
  description: '',
}

export default function OrganizationSetup() {
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [farms, setFarms] = useState<FarmInput[]>([{ ...blankFarm }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([hierarchyService.getCurrentUser(), hierarchyService.getCurrentOrganization()])
      .then(([currentUser, currentOrganization]) => {
        setUser(currentUser)
        setOrganization(currentOrganization)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load organization setup.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await hierarchyService.createOrganization({
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        address: address.trim(),
        description: description.trim(),
        initialFarms: farms.map((farm) => ({
          ...farm,
          name: farm.name.trim(),
          location: farm.location?.trim(),
          address: farm.address?.trim(),
          description: farm.description?.trim(),
          area: farm.area ? Number(farm.area) : null,
        })),
      })
      setOrganization(created)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save organization details.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateFarm(index: number, patch: Partial<FarmInput>) {
    setFarms((current) => current.map((farm, farmIndex) => farmIndex === index ? { ...farm, ...patch } : farm))
  }

  if (loading) return <p aria-busy="true">Loading organization setup…</p>
  if (user?.role !== 'FARM_OWNER') {
    return <p role="alert">{error || 'Only the Farm Owner can complete organization setup.'}</p>
  }

  if (organization) {
    return (
      <>
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">Organization setup complete</p>
            <h1 className="page-title">{organization.name}</h1>
            <p className="page-description">Your organization and {organization.farmCount} farm(s) are saved.</p>
          </div>
          <Link className="button button-primary" to={APP_ROUTES.users}>Manage members</Link>
        </div>
        <Card>
          <p><strong>Email:</strong> {organization.email}</p>
          <p><strong>Contact:</strong> {organization.contact || 'Not provided'}</p>
          <p><strong>Address:</strong> {organization.address || 'Not provided'}</p>
          <Button onClick={() => navigate(APP_ROUTES.dashboard)}>Continue to dashboard</Button>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">First-time onboarding</p>
          <h1 className="page-title">Set up your organization</h1>
          <p className="page-description">Organization and farm details are stored in FarmVerse.</p>
        </div>
      </div>
      <form aria-busy={submitting} className="content-grid two" onSubmit={handleSubmit}>
        <Card>
          <h2 className="panel-title">Organization details</h2>
          <div className="fv-fields-stack">
            <Input label="Organization name" name="organizationName" required value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Organization email" name="organizationEmail" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input label="Contact number" name="contact" required value={contact} onChange={(event) => setContact(event.target.value)} />
            <Input label="Organization address" name="address" required value={address} onChange={(event) => setAddress(event.target.value)} />
            <label className="field">
              <span className="field-label">Description (optional)</span>
              <textarea className="field-control" name="description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </div>
        </Card>
        <div className="fv-fields-stack">
          {farms.map((farm, index) => (
            <Card key={index}>
              <div className="section-heading" style={{ marginTop: 0 }}>
                <h2 className="panel-title">Farm {index + 1}</h2>
                {farms.length > 1 && <Button onClick={() => setFarms((current) => current.filter((_, farmIndex) => farmIndex !== index))} type="button" variant="ghost">Remove</Button>}
              </div>
              <div className="fv-fields-stack">
                <Input label="Farm name" name={`farm-${index}-name`} required value={farm.name} onChange={(event) => updateFarm(index, { name: event.target.value })} />
                <Input label="Farm location" name={`farm-${index}-location`} required value={farm.location ?? ''} onChange={(event) => updateFarm(index, { location: event.target.value })} />
                <Input label="Farm address" name={`farm-${index}-address`} required value={farm.address ?? ''} onChange={(event) => updateFarm(index, { address: event.target.value })} />
                <div className="content-grid two">
                  <Input label="Area" min="0.01" name={`farm-${index}-area`} required step="any" type="number" value={farm.area ?? ''} onChange={(event) => updateFarm(index, { area: event.target.value ? Number(event.target.value) : null })} />
                  <label className="field">
                    <span className="field-label">Area unit</span>
                    <select className="field-control" value={farm.areaUnit} onChange={(event) => updateFarm(index, { areaUnit: event.target.value })}>
                      <option value="acre">Acre</option>
                      <option value="hectare">Hectare</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Farm description (optional)</span>
                  <textarea className="field-control" rows={2} value={farm.description ?? ''} onChange={(event) => updateFarm(index, { description: event.target.value })} />
                </label>
              </div>
            </Card>
          ))}
          <Button onClick={() => setFarms((current) => [...current, { ...blankFarm }])} type="button" variant="secondary">Add another farm</Button>
          {error && <p className="auth-status error" role="alert">{error}</p>}
          <Button disabled={submitting} size="lg" type="submit">{submitting ? 'Saving…' : 'Save organization and farms'}</Button>
        </div>
      </form>
    </>
  )
}
