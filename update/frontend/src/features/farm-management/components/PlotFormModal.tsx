import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { farmApi, toApiError } from '../services/farmApi'
import type { Plot } from '../types/farm-management.types'
import { formatAcres } from '../utils/format'
import { checkDecimals, checkMax, isPositive, optionalText, parseOptionalNumber, type FieldErrors } from '../utils/validation'

interface PlotFormModalProps {
  open: boolean
  farmId: number
  /** Present when editing a plot. */
  plot?: Plot
  /** Acres that can still be given to this plot (for an edit, this includes the plot's own area). */
  availableAcres: number
  onClose: () => void
  onSaved: (plot: Plot, mode: 'created' | 'updated') => void
}

const SOIL_TYPES = ['Red', 'Black', 'Loamy', 'Sandy', 'Clay', 'Alluvial']

export function PlotFormModal({ open, plot, onClose, ...rest }: PlotFormModalProps) {
  return (
    <Modal
      description="Plots divide a farm into fields. Together they cannot be larger than the farm."
      onClose={onClose}
      open={open}
      title={plot ? 'Edit plot' : 'Add plot'}
    >
      <PlotForm onClose={onClose} plot={plot} {...rest} />
    </Modal>
  )
}

function PlotForm({ farmId, plot, availableAcres, onClose, onSaved }: Omit<PlotFormModalProps, 'open'>) {
  const [name, setName] = useState(plot?.name ?? '')
  const [area, setArea] = useState(plot?.areaAcres?.toString() ?? '')
  const [soilType, setSoilType] = useState(plot?.soilType ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found: FieldErrors = {}
    if (!name.trim()) found.name = 'Plot name is required.'

    const areaValue = parseOptionalNumber(area)
    if (!isPositive(areaValue)) found.areaAcres = 'Enter an area greater than 0.'
    else {
      checkDecimals(found, 'areaAcres', areaValue, 2)
      checkMax(found, 'areaAcres', areaValue, 99_999_999.99)
      if (!found.areaAcres && areaValue > availableAcres + 1e-9) {
        found.areaAcres =
          availableAcres > 0
            ? `Only ${formatAcres(availableAcres)} of the farm is left to divide.`
            : 'The whole farm is already divided into plots.'
      }
    }
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    const body = { name: name.trim(), areaAcres: Number(area), soilType: optionalText(soilType) }
    setBusy(true)
    try {
      if (plot) onSaved(await farmApi.updatePlot(plot.id, body), 'updated')
      else onSaved(await farmApi.createPlot(farmId, body), 'created')
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="form-grid">
        <div className="form-full">
          <Input autoFocus error={errors.name} label="Plot name" onChange={(e) => setName(e.target.value)} placeholder="e.g. North Field" value={name} />
        </div>
        <Input
          error={errors.areaAcres}
          inputMode="decimal"
          label="Area (acres)"
          onChange={(e) => setArea(e.target.value)}
          step="any"
          type="number"
          value={area}
        />
        <Input
          error={errors.soilType}
          label="Soil type"
          list="soil-type-options"
          onChange={(e) => setSoilType(e.target.value)}
          placeholder="e.g. Red"
          value={soilType}
        />
        <datalist id="soil-type-options">
          {SOIL_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </div>
      <p className="field-hint">{formatAcres(availableAcres)} of the farm is available for this plot.</p>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="form-actions">
        <Button disabled={busy} onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button disabled={busy} type="submit">
          {busy ? 'Saving…' : plot ? 'Save plot' : 'Add plot'}
        </Button>
      </div>
    </form>
  )
}
