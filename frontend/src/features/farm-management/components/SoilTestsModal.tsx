import { useCallback, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Table } from '../../../components/ui/Table'
import { Textarea } from '../../../components/ui/Textarea'
import { useRemote } from '../../../hooks/useRemote'
import { farmApi, toApiError } from '../services/farmApi'
import type { Plot, SoilTest } from '../types/farm-management.types'
import { formatDate, formatNumber, todayIso } from '../utils/format'
import {
  checkDecimals,
  checkMax,
  checkNonNegative,
  checkRange,
  optionalText,
  parseOptionalNumber,
  type FieldErrors,
} from '../utils/validation'

interface SoilTestsModalProps {
  /** The plot whose tests are shown; null keeps the dialog closed. */
  plot: Plot | null
  canManage: boolean
  onClose: () => void
  /** Called after any change so the farm summary can refresh its "latest soil test" column. */
  onChanged: () => void
}

export function SoilTestsModal({ plot, canManage, onClose, onChanged }: SoilTestsModalProps) {
  return (
    <Modal
      description="Lab results for this plot, newest first."
      onClose={onClose}
      open={plot !== null}
      size="lg"
      title={plot ? `Soil tests · ${plot.name}` : 'Soil tests'}
    >
      {plot && <SoilTestsPanel canManage={canManage} key={plot.id} onChanged={onChanged} plot={plot} />}
    </Modal>
  )
}

type Editing = { test?: SoilTest } | null

function SoilTestsPanel({ plot, canManage, onChanged }: Omit<SoilTestsModalProps, 'onClose' | 'plot'> & { plot: Plot }) {
  const load = useCallback((signal: AbortSignal) => farmApi.listSoilTests(plot.id, signal), [plot.id])
  const { data: tests, error, loading, reload } = useRemote(load)
  const [editing, setEditing] = useState<Editing>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  function saved() {
    setEditing(null)
    reload()
    onChanged()
  }

  async function remove(test: SoilTest) {
    setActionError('')
    try {
      await farmApi.deleteSoilTest(test.id)
      setConfirmingId(null)
      reload()
      onChanged()
    } catch (e) {
      setActionError(toApiError(e).message)
    }
  }

  const columns = [
    { key: 'date', header: 'Date', render: (test: SoilTest) => <span className="table-primary">{formatDate(test.testDate)}</span> },
    { key: 'ph', header: <span className="keep-case">pH</span>, render: (test: SoilTest) => formatNumber(test.ph) },
    { key: 'n', header: 'N', render: (test: SoilTest) => formatNumber(test.nitrogen) },
    { key: 'p', header: 'P', render: (test: SoilTest) => formatNumber(test.phosphorus) },
    { key: 'k', header: 'K', render: (test: SoilTest) => formatNumber(test.potassium) },
    { key: 'notes', header: 'Notes', render: (test: SoilTest) => <span className="clamp-notes">{test.notes || '—'}</span> },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (test: SoilTest) =>
              confirmingId === test.id ? (
                <span className="row-actions">
                  <Button onClick={() => remove(test)} size="sm" variant="danger">
                    Delete test
                  </Button>
                  <Button onClick={() => setConfirmingId(null)} size="sm" variant="secondary">
                    Keep
                  </Button>
                </span>
              ) : (
                <span className="row-actions">
                  <button
                    aria-label={`Edit soil test from ${formatDate(test.testDate)}`}
                    className="icon-button icon-button-sm"
                    onClick={() => setEditing({ test })}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={13} />
                  </button>
                  <button
                    aria-label={`Delete soil test from ${formatDate(test.testDate)}`}
                    className="icon-button icon-button-sm"
                    onClick={() => {
                      setActionError('')
                      setConfirmingId(test.id)
                    }}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={13} />
                  </button>
                </span>
              ),
          },
        ]
      : []),
  ]

  return (
    <>
      {canManage && !editing && (
        <div className="panel-toolbar">
          <Button onClick={() => setEditing({})} size="sm">
            <Plus aria-hidden="true" size={13} /> Add soil test
          </Button>
        </div>
      )}
      {editing && <SoilTestForm key={editing.test?.id ?? 'new'} onCancel={() => setEditing(null)} onSaved={saved} plotId={plot.id} test={editing.test} />}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      <Card padding={false}>
        <Table
          caption={`Soil tests for ${plot.name}`}
          columns={columns}
          emptyMessage={canManage ? 'No soil tests yet. Add the first lab result for this plot.' : 'No soil tests have been recorded for this plot.'}
          error={error && !tests ? error.message : undefined}
          getRowKey={(test) => test.id}
          isLoading={loading}
          rows={tests ?? []}
        />
      </Card>
      <p className="field-hint">N, P and K are shown as entered from the lab report.</p>
    </>
  )
}

interface SoilTestFormProps {
  plotId: number
  test?: SoilTest
  onCancel: () => void
  onSaved: () => void
}

function SoilTestForm({ plotId, test, onCancel, onSaved }: SoilTestFormProps) {
  const [values, setValues] = useState({
    testDate: test?.testDate ?? todayIso(),
    ph: test?.ph?.toString() ?? '',
    nitrogen: test?.nitrogen?.toString() ?? '',
    phosphorus: test?.phosphorus?.toString() ?? '',
    potassium: test?.potassium?.toString() ?? '',
    notes: test?.notes ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found: FieldErrors = {}
    if (!values.testDate) found.testDate = 'Test date is required.'
    else if (values.testDate > todayIso()) found.testDate = 'Test date cannot be in the future.'

    const ph = parseOptionalNumber(values.ph)
    checkRange(found, 'ph', ph, 0, 14, 'pH must be between 0 and 14.')
    checkDecimals(found, 'ph', ph, 1)

    const readings = {
      nitrogen: parseOptionalNumber(values.nitrogen),
      phosphorus: parseOptionalNumber(values.phosphorus),
      potassium: parseOptionalNumber(values.potassium),
    }
    ;(['nitrogen', 'phosphorus', 'potassium'] as const).forEach((field) => {
      checkNonNegative(found, field, readings[field], `${field[0].toUpperCase()}${field.slice(1)} cannot be negative.`)
      checkMax(found, field, readings[field], 9999.99)
      checkDecimals(found, field, readings[field], 2)
    })
    if (values.notes.length > 1000) found.notes = 'Notes can be at most 1,000 characters.'

    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    const body = { testDate: values.testDate, ph, ...readings, notes: optionalText(values.notes) }
    setBusy(true)
    try {
      if (test) await farmApi.updateSoilTest(test.id, body)
      else await farmApi.addSoilTest(plotId, body)
      onSaved()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
      setBusy(false)
    }
  }

  return (
    <form className="inline-form" noValidate onSubmit={submit}>
      <p className="inline-form-title">{test ? 'Edit soil test' : 'New soil test'}</p>
      <div className="form-grid">
        <Input error={errors.testDate} label="Test date" max={todayIso()} onChange={set('testDate')} type="date" value={values.testDate} />
        <Input error={errors.ph} inputMode="decimal" label="pH" onChange={set('ph')} placeholder="e.g. 6.5" step="any" type="number" value={values.ph} />
      </div>
      <div className="form-grid three" style={{ marginTop: 13 }}>
        <Input error={errors.nitrogen} inputMode="decimal" label="Nitrogen (N)" onChange={set('nitrogen')} step="any" type="number" value={values.nitrogen} />
        <Input error={errors.phosphorus} inputMode="decimal" label="Phosphorus (P)" onChange={set('phosphorus')} step="any" type="number" value={values.phosphorus} />
        <Input error={errors.potassium} inputMode="decimal" label="Potassium (K)" onChange={set('potassium')} step="any" type="number" value={values.potassium} />
      </div>
      <div style={{ marginTop: 13 }}>
        <Textarea error={errors.notes} label="Notes" maxLength={1000} onChange={set('notes')} placeholder="Optional: lab name, sampling depth, remarks" rows={2} value={values.notes} />
      </div>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="form-actions">
        <Button disabled={busy} onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button disabled={busy} type="submit">
          {busy ? 'Saving…' : test ? 'Save soil test' : 'Add soil test'}
        </Button>
      </div>
    </form>
  )
}
