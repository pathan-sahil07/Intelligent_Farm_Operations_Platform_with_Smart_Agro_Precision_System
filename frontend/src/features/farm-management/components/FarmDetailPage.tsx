import { useCallback, useState } from 'react'
import { ArrowLeft, ExternalLink, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Table } from '../../../components/ui/Table'
import { APP_ROUTES } from '../../../constants/routes.constants'
import { useSession } from '../../../contexts/SessionContext'
import { useNotice } from '../../../hooks/useNotice'
import { useRemote } from '../../../hooks/useRemote'
import { farmApi, toApiError } from '../services/farmApi'
import type { LandDocument, Plot, PlotWithSoil, SoilTest } from '../types/farm-management.types'
import { formatAcres, formatDate, formatLocation, formatNumber, round2, userLabel } from '../utils/format'
import { canManageFarms } from '../utils/permissions'
import '../farm-management.css'
import { AreaBar } from './AreaBar'
import { ConfirmDialog } from './ConfirmDialog'
import { DocumentsSection } from './DocumentsSection'
import { DocumentUploadModal } from './DocumentUploadModal'
import { FarmFormModal } from './FarmFormModal'
import { PlotFormModal } from './PlotFormModal'
import { SoilTestsModal } from './SoilTestsModal'
import { Toast } from './Toast'
import { WorkersSection } from './WorkersSection'

const MODULE_LINKS: Record<string, { label: string; path: string }> = {
  crops: { label: 'Crop lifecycle', path: APP_ROUTES.crops },
  irrigation: { label: 'Irrigation', path: APP_ROUTES.irrigation },
  weather: { label: 'Weather', path: APP_ROUTES.weather },
  gis: { label: 'GIS mapping', path: APP_ROUTES.gis },
}

function soilReadings(test: SoilTest): string {
  const parts = [
    test.ph !== null && `pH ${formatNumber(test.ph)}`,
    test.nitrogen !== null && `N ${formatNumber(test.nitrogen)}`,
    test.phosphorus !== null && `P ${formatNumber(test.phosphorus)}`,
    test.potassium !== null && `K ${formatNumber(test.potassium)}`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'No readings entered'
}

function FarmDetailPage() {
  const { farmId } = useParams()
  const id = Number(farmId)
  const navigate = useNavigate()
  const { session } = useSession()
  const canManage = canManageFarms(session.role)

  const load = useCallback(
    async (signal: AbortSignal) => {
      const [summary, documents] = await Promise.all([farmApi.getSummary(id, signal), farmApi.listDocuments(id, signal)])
      return { summary, documents }
    },
    [id],
  )
  const { data, error, loading, reload } = useRemote(load)
  const { notice, show, dismiss } = useNotice()

  const [farmModalOpen, setFarmModalOpen] = useState(false)
  const [plotModal, setPlotModal] = useState<{ plot?: Plot } | null>(null)
  const [soilPlot, setSoilPlot] = useState<Plot | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [plotToDelete, setPlotToDelete] = useState<Plot | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<LandDocument | null>(null)
  const [farmDeleteOpen, setFarmDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  /** Runs a destructive call from a confirm dialog: closes it and refreshes on success, explains on failure. */
  async function confirmed(action: () => Promise<void>, success: string, close: () => void, after: () => void = reload) {
    setBusy(true)
    setConfirmError('')
    try {
      await action()
      close()
      show(success)
      after()
    } catch (e) {
      setConfirmError(toApiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  const backLink = (
    <Link className="back-link" to={APP_ROUTES.farms}>
      <ArrowLeft aria-hidden="true" size={13} /> All farms
    </Link>
  )

  if (loading && !data) {
    return (
      <>
        {backLink}
        <Card>
          <p aria-live="polite" className="table-state">
            Loading farm…
          </p>
        </Card>
      </>
    )
  }

  if (!data) {
    const missing = error?.status === 404
    return (
      <>
        {backLink}
        <Card className="state-card">
          <h1 className="page-title">{missing ? 'This farm does not exist' : 'We could not load this farm'}</h1>
          <p className="page-description" role="alert">
            {missing ? 'It may have been deleted. Go back to the list to pick another farm.' : error?.message}
          </p>
          <div className="inline-actions" style={{ marginTop: 16 }}>
            {!missing && <Button onClick={reload}>Try again</Button>}
            <Link className="button button-secondary" to={APP_ROUTES.farms}>
              Back to farms
            </Link>
          </div>
        </Card>
      </>
    )
  }

  const { summary, documents } = data
  const { farm } = summary

  // The API does not enforce access yet, so mirror the intended rules in the screen.
  const accessProblem =
    session.role === 'farmer' && farm.ownerId !== session.userId
      ? `This farm belongs to ${userLabel(farm.ownerId)}. Switch to its owner or to an admin to open it.`
      : session.role === 'worker' && !summary.assignedWorkerIds.includes(session.userId)
        ? `You are not assigned to this farm. Ask an admin or the owner to assign ${userLabel(session.userId)}.`
        : null

  if (accessProblem) {
    return (
      <>
        {backLink}
        <Card className="state-card">
          <h1 className="page-title">You cannot open this farm</h1>
          <p className="page-description">{accessProblem}</p>
        </Card>
      </>
    )
  }

  const plots = [...summary.plots].sort((a, b) => a.plot.id - b.plot.id)
  const hasCoordinates = farm.latitude !== null && farm.longitude !== null
  const plottedShare = farm.totalAreaAcres > 0 ? Math.round((summary.plottedAreaAcres / farm.totalAreaAcres) * 100) : 0

  const plotColumns = [
    {
      key: 'plot',
      header: 'Plot',
      render: ({ plot }: PlotWithSoil) => (
        <>
          <span className="table-primary">{plot.name}</span>
          <span className="table-secondary">{plot.soilType ? `${plot.soilType} soil` : 'Soil type not set'}</span>
        </>
      ),
    },
    {
      key: 'area',
      header: 'Area',
      render: ({ plot }: PlotWithSoil) => (
        <>
          <span className="table-primary">{formatAcres(plot.areaAcres)}</span>
          <span className="table-secondary">{Math.round((plot.areaAcres / farm.totalAreaAcres) * 100)}% of farm</span>
        </>
      ),
    },
    {
      key: 'soil',
      header: 'Latest soil test',
      render: ({ latestSoilTest }: PlotWithSoil) =>
        latestSoilTest ? (
          <>
            <span className="table-primary">{formatDate(latestSoilTest.testDate)}</span>
            <span className="table-secondary">{soilReadings(latestSoilTest)}</span>
          </>
        ) : (
          <span className="muted">No test yet</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: ({ plot }: PlotWithSoil) => (
        <span className="row-actions">
          <Button onClick={() => setSoilPlot(plot)} size="sm" variant="secondary">
            Soil tests
            <span className="sr-only"> for {plot.name}</span>
          </Button>
          {canManage && (
            <>
              <button aria-label={`Edit plot ${plot.name}`} className="icon-button icon-button-sm" onClick={() => setPlotModal({ plot })} type="button">
                <Pencil aria-hidden="true" size={13} />
              </button>
              <button
                aria-label={`Delete plot ${plot.name}`}
                className="icon-button icon-button-sm"
                onClick={() => {
                  setConfirmError('')
                  setPlotToDelete(plot)
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" size={13} />
              </button>
            </>
          )}
        </span>
      ),
    },
  ]

  const editingPlot = plotModal?.plot
  const availableForPlot = round2(summary.unplottedAreaAcres + (editingPlot?.areaAcres ?? 0))

  return (
    <>
      {backLink}
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operations / Farm management</p>
          <h1 className="page-title">{farm.name}</h1>
          <p className="page-description">{formatLocation(farm)}</p>
        </div>
        {canManage && (
          <div className="inline-actions">
            <Button onClick={() => setFarmModalOpen(true)} variant="secondary">
              <Pencil aria-hidden="true" size={14} /> Edit farm
            </Button>
            <Button
              onClick={() => {
                setConfirmError('')
                setFarmDeleteOpen(true)
              }}
              variant="secondary"
            >
              <Trash2 aria-hidden="true" size={14} /> Delete farm
            </Button>
          </div>
        )}
      </div>

      <p className="farm-meta">
        <span>Owner {userLabel(farm.ownerId)}</span>
        <span>Added {formatDate(farm.createdAt)}</span>
        {hasCoordinates && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${farm.latitude}&mlon=${farm.longitude}#map=14/${farm.latitude}/${farm.longitude}`}
            rel="noreferrer"
            target="_blank"
          >
            <MapPin aria-hidden="true" size={12} /> {farm.latitude}, {farm.longitude}
            <ExternalLink aria-hidden="true" size={11} />
            <span className="sr-only"> (opens OpenStreetMap in a new tab)</span>
          </a>
        )}
      </p>

      {error && (
        <div className="notice warning" role="alert">
          <span>Could not refresh this farm: {error.message} Showing the last loaded data.</span>
        </div>
      )}

      <div className="content-grid four">
        <Card className="stat-card">
          <span className="stat-label">Total area</span>
          <p className="stat-value">{formatAcres(farm.totalAreaAcres)}</p>
          <span className="stat-note">Registered farm size</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Divided into plots</span>
          <p className="stat-value">{formatAcres(summary.plottedAreaAcres)}</p>
          <span className="stat-note">
            {summary.plotCount} {summary.plotCount === 1 ? 'plot' : 'plots'} · {plottedShare}% of the farm
          </span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">Still unplotted</span>
          <p className="stat-value">{formatAcres(summary.unplottedAreaAcres)}</p>
          <span className="stat-note">{summary.unplottedAreaAcres > 0 ? 'Available for new plots' : 'Every acre is in a plot'}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">People and papers</span>
          <p className="stat-value">{summary.workers.length} {summary.workers.length === 1 ? 'worker' : 'workers'}</p>
          <span className="stat-note">
            {summary.documentCount} {summary.documentCount === 1 ? 'document' : 'documents'} on file
          </span>
        </Card>
      </div>

      <div className="section-heading">
        <div>
          <h2>How the land is divided</h2>
          <p>Each slice is one plot, sized by its acreage</p>
        </div>
      </div>
      <Card>
        <AreaBar plots={plots.map(({ plot }) => plot)} totalAcres={farm.totalAreaAcres} unplottedAcres={summary.unplottedAreaAcres} />
      </Card>

      <div className="section-heading">
        <div>
          <h2>Plots</h2>
          <p>Fields on this farm and their latest soil results</p>
        </div>
        {canManage && (
          <Button
            disabled={summary.unplottedAreaAcres <= 0}
            onClick={() => setPlotModal({})}
            title={summary.unplottedAreaAcres <= 0 ? 'The whole farm is already divided into plots' : undefined}
          >
            <Plus aria-hidden="true" size={15} /> Add plot
          </Button>
        )}
      </div>
      <Card padding={false}>
        <Table
          caption="Plots on this farm"
          columns={plotColumns}
          emptyMessage={canManage ? 'No plots yet. Add a plot to start dividing this farm.' : 'No plots have been added to this farm yet.'}
          getRowKey={({ plot }) => plot.id}
          rows={plots}
        />
      </Card>

      <div className="section-heading">
        <div>
          <h2>Field workers</h2>
          <p>People assigned to work on this farm</p>
        </div>
      </div>
      <WorkersSection
        canManage={canManage}
        farmId={farm.id}
        onChanged={(message) => {
          show(message)
          reload()
        }}
        onFailed={(message) => show(message, 'error')}
        workers={summary.workers}
      />

      <div className="section-heading">
        <div>
          <h2>Land documents</h2>
          <p>Passbook, survey map, sale deed and other papers</p>
        </div>
      </div>
      <DocumentsSection
        canManage={canManage}
        documents={documents}
        onDelete={(document) => {
          setConfirmError('')
          setDocumentToDelete(document)
        }}
        onFailed={(message) => show(message, 'error')}
        onUpload={() => setUploadOpen(true)}
      />

      <div className="section-heading">
        <div>
          <h2>Connected modules</h2>
          <p>Other parts of Fieldwise that will build on this farm</p>
        </div>
      </div>
      <div className="content-grid four">
        {Object.entries(summary.upcomingModules).map(([key, status]) => {
          const link = MODULE_LINKS[key]
          if (!link) return null
          return (
            <Link className="module-link" key={key} to={link.path}>
              <Card>
                <span className="module-link-title">{link.label}</span>
                <span className="module-link-description">{status}</span>
              </Card>
            </Link>
          )
        })}
      </div>

      <FarmFormModal
        farm={farm}
        onClose={() => setFarmModalOpen(false)}
        onSaved={() => {
          setFarmModalOpen(false)
          show('Changes saved.')
          reload()
        }}
        open={farmModalOpen}
        plottedAcres={summary.plottedAreaAcres}
      />
      <PlotFormModal
        availableAcres={availableForPlot}
        farmId={farm.id}
        key={editingPlot?.id ?? 'new'}
        onClose={() => setPlotModal(null)}
        onSaved={(plot, mode) => {
          setPlotModal(null)
          show(mode === 'created' ? `${plot.name} was added.` : 'Plot saved.')
          reload()
        }}
        open={plotModal !== null}
        plot={editingPlot}
      />
      <SoilTestsModal canManage={canManage} onChanged={reload} onClose={() => setSoilPlot(null)} plot={soilPlot} />
      <DocumentUploadModal
        farmId={farm.id}
        onClose={() => setUploadOpen(false)}
        onUploaded={(document) => {
          setUploadOpen(false)
          show(`${document.fileName} was uploaded.`)
          reload()
        }}
        open={uploadOpen}
      />

      <ConfirmDialog
        busy={busy}
        confirmLabel="Delete plot"
        error={confirmError}
        onClose={() => setPlotToDelete(null)}
        onConfirm={() => plotToDelete && confirmed(() => farmApi.deletePlot(plotToDelete.id), `${plotToDelete.name} was deleted.`, () => setPlotToDelete(null))}
        open={plotToDelete !== null}
        title="Delete this plot?"
      >
        <p>
          <strong>{plotToDelete?.name}</strong> and all of its soil test records will be deleted. This cannot be undone.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        busy={busy}
        confirmLabel="Delete document"
        error={confirmError}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() =>
          documentToDelete &&
          confirmed(() => farmApi.deleteDocument(documentToDelete.id), `${documentToDelete.fileName} was deleted.`, () => setDocumentToDelete(null))
        }
        open={documentToDelete !== null}
        title="Delete this document?"
      >
        <p>
          <strong>{documentToDelete?.fileName}</strong> will be removed from the farm and from the server. This cannot be undone.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        busy={busy}
        confirmLabel="Delete farm"
        error={confirmError}
        onClose={() => setFarmDeleteOpen(false)}
        onConfirm={() =>
          confirmed(
            () => farmApi.deleteFarm(farm.id),
            '',
            () => setFarmDeleteOpen(false),
            () => navigate(APP_ROUTES.farms, { state: { notice: `${farm.name} was deleted.` } }),
          )
        }
        open={farmDeleteOpen}
        title={`Delete ${farm.name}?`}
      >
        <p>
          This also deletes its {summary.plotCount} {summary.plotCount === 1 ? 'plot' : 'plots'}, their soil tests, {summary.workers.length} worker{' '}
          {summary.workers.length === 1 ? 'assignment' : 'assignments'} and {summary.documentCount}{' '}
          {summary.documentCount === 1 ? 'document' : 'documents'}. This cannot be undone.
        </p>
      </ConfirmDialog>

      <Toast notice={notice} onDismiss={dismiss} />
    </>
  )
}

export { FarmDetailPage }
