import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Sprout } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Table } from '../../../components/ui/Table'
import { farmPath } from '../../../constants/routes.constants'
import { useSession } from '../../../contexts/useSession'
import { ROLE_LABELS } from '../../../contexts/session.constants'
import { useNotice } from '../../../hooks/useNotice'
import { useRemote } from '../../../hooks/useRemote'
import { farmApi } from '../services/farmApi'
import type { Farm } from '../types/farm-management.types'
import { formatAcres, formatDate, formatLocation, round2, userLabel } from '../utils/format'
import { canManageFarms } from '../utils/permissions'
import '../farm-management.css'
import { FarmFormModal } from './FarmFormModal'
import { Toast } from './Toast'

function FarmManagementPage() {
  const { role, userId } = useSession().session
  const canManage = canManageFarms(role)
  const navigate = useNavigate()
  const location = useLocation()

  // A farm deleted on its own page sends its confirmation here; read it once, then clear it.
  const [flash] = useState(() => (location.state as { notice?: string } | null)?.notice ?? '')
  const { notice, show, dismiss } = useNotice(flash)
  useEffect(() => {
    if (flash) navigate(location.pathname, { replace: true, state: null })
  }, [flash, navigate, location.pathname])

  // Admin sees every farm, a farmer their own, a field worker the farms they are assigned to.
  const load = useCallback(
    (signal: AbortSignal) =>
      farmApi.listFarms(role === 'admin' ? {} : role === 'farmer' ? { ownerId: userId } : { workerId: userId }, signal),
    [role, userId],
  )
  const { data: farms, error, loading, reload } = useRemote(load)

  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...(farms ?? [])]
      .filter((farm) => !query || [farm.name, farm.village, farm.district, farm.state].some((part) => part?.toLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [farms, search])

  const totalArea = round2((farms ?? []).reduce((sum, farm) => sum + farm.totalAreaAcres, 0))

  const scope =
    role === 'admin' ? 'every farm in the system' : role === 'farmer' ? `farms owned by ${userLabel(userId)}` : `farms assigned to ${userLabel(userId)}`

  const emptyMessage = search
    ? 'No farms match your search.'
    : role === 'worker'
      ? 'No farms are assigned to you yet. Ask an admin or a farm owner to assign you.'
      : canManage
        ? 'No farms yet. Add your first farm to start dividing it into plots.'
        : 'No farms to show.'

  const columns = [
    {
      key: 'name',
      header: 'Farm',
      render: (farm: Farm) => (
        <>
          <Link className="table-link" to={farmPath(farm.id)}>
            {farm.name}
          </Link>
          <span className="table-secondary">{formatLocation(farm)}</span>
        </>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (farm: Farm) => (farm.ownerId === userId ? `${userLabel(farm.ownerId)} (you)` : userLabel(farm.ownerId)),
    },
    { key: 'area', header: 'Total area', render: (farm: Farm) => formatAcres(farm.totalAreaAcres) },
    { key: 'added', header: 'Added', render: (farm: Farm) => formatDate(farm.createdAt) },
    {
      key: 'open',
      header: '',
      render: (farm: Farm) => (
        <span className="row-actions">
          <Link className="button button-secondary button-sm" to={farmPath(farm.id)}>
            Open
            <span className="sr-only"> {farm.name}</span>
          </Link>
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Farm management</p>
          <h1 className="page-title">Your farms, at a glance</h1>
          <p className="page-description">Register farms, divide them into plots, and keep soil results, workers and land papers together.</p>
        </div>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus aria-hidden="true" size={15} /> Add farm
          </Button>
        )}
      </div>

      {role === 'worker' && (
        <div className="notice">
          <Sprout aria-hidden="true" size={15} />
          <span>Field workers can read farm details but cannot change them.</span>
        </div>
      )}

      <div className="content-grid three" style={{ marginTop: 16 }}>
        <Card className="stat-card">
          <span className="stat-label">Showing</span>
          <p className="stat-value">{ROLE_LABELS[role]} view</p>
          <span className="stat-note">{scope}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Farms</span>
          <p className="stat-value">{farms?.length ?? '—'}</p>
          <span className="stat-note">{farms?.length === 1 ? '1 farm registered' : 'Registered in this view'}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Managed area</span>
          <p className="stat-value">{farms ? formatAcres(totalArea) : '—'}</p>
          <span className="stat-note">Combined total area</span>
        </Card>
      </div>

      <div className="section-heading">
        <div>
          <h2>Registered farms</h2>
          <p>Open a farm to manage its plots, soil tests, workers and documents</p>
        </div>
        <div className="list-search">
          <Input
            label="Search farms"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, village, district or state"
            type="search"
            value={search}
          />
        </div>
      </div>
      <Card padding={false}>
        <Table
          caption="Registered farms"
          columns={columns}
          emptyMessage={emptyMessage}
          error={error && !farms ? error.message : undefined}
          getRowKey={(farm) => farm.id}
          isLoading={loading}
          rows={visible}
        />
        {error && !farms && (
          <div className="table-retry">
            <Button onClick={reload} size="sm" variant="secondary">
              Try again
            </Button>
          </div>
        )}
      </Card>

      <FarmFormModal
        onClose={() => setModalOpen(false)}
        onSaved={(farm) => {
          setModalOpen(false)
          show(`${farm.name} was added.`)
          reload()
        }}
        open={modalOpen}
      />
      <Toast notice={notice} onDismiss={dismiss} />
    </>
  )
}

export { FarmManagementPage }
