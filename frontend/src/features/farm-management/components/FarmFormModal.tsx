import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useSession } from '../../../contexts/useSession'
import { farmApi, toApiError } from '../services/farmApi'
import type { Farm } from '../types/farm-management.types'
import { formatAcres, userLabel } from '../utils/format'
import {
  checkDecimals,
  checkMax,
  checkRange,
  isPositive,
  optionalText,
  parseOptionalNumber,
  type FieldErrors,
} from '../utils/validation'

type FieldName = 'name' | 'village' | 'district' | 'state' | 'latitude' | 'longitude' | 'totalAreaAcres' | 'ownerId'
type Values = Record<FieldName, string>

interface FarmFormModalProps {
  open: boolean
  /** Present when editing; absent when adding a farm. */
  farm?: Farm
  /** Area already divided into plots: the farm cannot be made smaller than this. */
  plottedAcres?: number
  onClose: () => void
  onSaved: (farm: Farm, mode: 'created' | 'updated') => void
}

export function FarmFormModal({ open, farm, onClose, ...rest }: FarmFormModalProps) {
  return (
    <Modal
      description={
        farm
          ? 'Update the farm profile. The owner cannot be changed.'
          : 'Register a farm first. Plots, workers and documents are added to it afterwards.'
      }
      onClose={onClose}
      open={open}
      title={farm ? 'Edit farm' : 'Add farm'}
    >
      <FarmForm farm={farm} onClose={onClose} {...rest} />
    </Modal>
  )
}

function FarmForm({ farm, plottedAcres = 0, onClose, onSaved }: Omit<FarmFormModalProps, 'open'>) {
  const { session } = useSession()
  const isEdit = Boolean(farm)
  const [values, setValues] = useState<Values>({
    name: farm?.name ?? '',
    village: farm?.village ?? '',
    district: farm?.district ?? '',
    state: farm?.state ?? '',
    latitude: farm?.latitude?.toString() ?? '',
    longitude: farm?.longitude?.toString() ?? '',
    totalAreaAcres: farm?.totalAreaAcres?.toString() ?? '',
    ownerId: String(farm?.ownerId ?? session.userId),
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  // Admins choose the owner; a farmer always adds farms under their own id.
  const ownerEditable = !isEdit && session.role === 'admin'

  const bind = (field: FieldName) => ({
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) => setValues((current) => ({ ...current, [field]: event.target.value })),
  })

  function validate(): FieldErrors {
    const found: FieldErrors = {}
    if (!values.name.trim()) found.name = 'Farm name is required.'

    const area = parseOptionalNumber(values.totalAreaAcres)
    if (!isPositive(area)) found.totalAreaAcres = 'Enter a total area greater than 0.'
    else {
      checkDecimals(found, 'totalAreaAcres', area, 2)
      checkMax(found, 'totalAreaAcres', area, 99_999_999.99)
      if (!found.totalAreaAcres && area < plottedAcres) {
        found.totalAreaAcres = `Cannot be less than the ${formatAcres(plottedAcres)} already divided into plots.`
      }
    }

    const latitude = parseOptionalNumber(values.latitude)
    const longitude = parseOptionalNumber(values.longitude)
    checkRange(found, 'latitude', latitude, -90, 90, 'Latitude must be between -90 and 90.')
    checkRange(found, 'longitude', longitude, -180, 180, 'Longitude must be between -180 and 180.')
    checkDecimals(found, 'latitude', latitude, 6)
    checkDecimals(found, 'longitude', longitude, 6)

    if (ownerEditable) {
      const owner = Number(values.ownerId)
      if (!Number.isInteger(owner) || owner <= 0) found.ownerId = 'Enter the owner’s user id (a whole number above 0).'
    }
    return found
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    const body = {
      name: values.name.trim(),
      village: optionalText(values.village),
      district: optionalText(values.district),
      state: optionalText(values.state),
      latitude: parseOptionalNumber(values.latitude),
      longitude: parseOptionalNumber(values.longitude),
      totalAreaAcres: Number(values.totalAreaAcres),
    }

    setBusy(true)
    try {
      if (farm) onSaved(await farmApi.updateFarm(farm.id, body), 'updated')
      else onSaved(await farmApi.createFarm({ ...body, ownerId: Number(values.ownerId) }), 'created')
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
          <Input autoFocus label="Farm name" placeholder="e.g. Green Valley" {...bind('name')} />
        </div>
        <Input label="Village" placeholder="e.g. Anandapuram" {...bind('village')} />
        <Input label="District" placeholder="e.g. Visakhapatnam" {...bind('district')} />
        <Input label="State" placeholder="e.g. Andhra Pradesh" {...bind('state')} />
        <Input inputMode="decimal" label="Total area (acres)" placeholder="e.g. 10" type="number" step="any" {...bind('totalAreaAcres')} />
        <Input inputMode="decimal" label="Latitude" placeholder="e.g. 17.9" type="number" step="any" {...bind('latitude')} />
        <Input inputMode="decimal" label="Longitude" placeholder="e.g. 83.4" type="number" step="any" {...bind('longitude')} />
        {ownerEditable ? (
          <Input inputMode="numeric" label="Owner user id" type="number" step="1" {...bind('ownerId')} />
        ) : (
          <p className="field-hint form-full">
            Owner: {userLabel(Number(values.ownerId))}
            {!isEdit && session.role === 'farmer' ? ' (you)' : ''}
          </p>
        )}
      </div>
      <p className="field-hint">Latitude and longitude are optional. The weather module uses them to find this farm.</p>
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
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add farm'}
        </Button>
      </div>
    </form>
  )
}
