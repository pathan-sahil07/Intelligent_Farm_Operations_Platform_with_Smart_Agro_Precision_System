import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { farmApi, toApiError } from '../services/farmApi'
import type { LandDocument } from '../types/farm-management.types'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['pdf', 'jpg', 'jpeg', 'png']
const DOC_TYPES = ['Passbook', 'Survey map', 'Sale deed', 'Lease agreement', 'Land tax receipt']

interface DocumentUploadModalProps {
  open: boolean
  farmId: number
  onClose: () => void
  onUploaded: (document: LandDocument) => void
}

export function DocumentUploadModal({ open, onClose, ...rest }: DocumentUploadModalProps) {
  return (
    <Modal
      description="Keep land papers with the farm. PDF, JPG or PNG, up to 10 MB."
      onClose={onClose}
      open={open}
      title="Upload document"
    >
      <UploadForm onClose={onClose} {...rest} />
    </Modal>
  )
}

function UploadForm({ farmId, onClose, onUploaded }: Omit<DocumentUploadModalProps, 'open'>) {
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  function checkFile(candidate: File | null): string {
    if (!candidate) return 'Choose a file to upload.'
    const extension = candidate.name.includes('.') ? candidate.name.split('.').pop()!.toLowerCase() : ''
    if (!ALLOWED.includes(extension)) return 'Only PDF, JPG and PNG files are allowed.'
    if (candidate.size > MAX_BYTES) return 'This file is larger than 10 MB.'
    if (candidate.size === 0) return 'This file is empty.'
    return ''
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = checkFile(file)
    setFileError(problem)
    setFormError('')
    if (problem || !file) return
    if (docType.length > 100) {
      setFormError('Document type can be at most 100 characters.')
      return
    }

    setBusy(true)
    try {
      onUploaded(await farmApi.uploadDocument(farmId, file, docType.trim()))
    } catch (error) {
      setFormError(toApiError(error).message)
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={submit}>
      <div className="form-grid">
        <div className="form-full">
          <Input
            label="Document type"
            list="doc-type-options"
            onChange={(e) => setDocType(e.target.value)}
            placeholder="e.g. Passbook"
            value={docType}
          />
          <datalist id="doc-type-options">
            {DOC_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>
        <div className="form-full">
          <Input
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            error={fileError}
            label="File"
            onChange={(e) => {
              const chosen = e.target.files?.[0] ?? null
              setFile(chosen)
              setFileError(chosen ? checkFile(chosen) : '')
            }}
            type="file"
          />
        </div>
      </div>
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
          {busy ? 'Uploading…' : 'Upload document'}
        </Button>
      </div>
    </form>
  )
}
