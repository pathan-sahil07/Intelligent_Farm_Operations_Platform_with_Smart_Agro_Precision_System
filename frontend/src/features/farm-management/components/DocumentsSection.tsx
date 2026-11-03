import { Download, FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Table } from '../../../components/ui/Table'
import { farmApi, toApiError } from '../services/farmApi'
import type { LandDocument } from '../types/farm-management.types'
import { formatDate } from '../utils/format'

interface DocumentsSectionProps {
  documents: LandDocument[]
  canManage: boolean
  onUpload: () => void
  onDelete: (document: LandDocument) => void
  onFailed: (message: string) => void
}

export function DocumentsSection({ documents, canManage, onUpload, onDelete, onFailed }: DocumentsSectionProps) {
  /** Fetches the file so a missing file shows a message here instead of navigating to a JSON error page. */
  async function download(document: LandDocument) {
    try {
      const url = URL.createObjectURL(await farmApi.downloadDocument(document.id))
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (error) {
      onFailed(toApiError(error).message)
    }
  }

  const columns = [
    {
      key: 'file',
      header: 'Document',
      render: (document: LandDocument) => (
        <span className="doc-name">
          <FileText aria-hidden="true" size={15} />
          <span>
            <span className="table-primary">{document.docType || 'Untyped document'}</span>
            <span className="table-secondary">{document.fileName}</span>
          </span>
        </span>
      ),
    },
    { key: 'uploaded', header: 'Uploaded', render: (document: LandDocument) => formatDate(document.uploadedAt) },
    {
      key: 'actions',
      header: '',
      render: (document: LandDocument) => (
        <span className="row-actions">
          <Button onClick={() => download(document)} size="sm" variant="secondary">
            <Download aria-hidden="true" size={13} /> Download
            <span className="sr-only"> {document.fileName}</span>
          </Button>
          {canManage && (
            <button
              aria-label={`Delete ${document.fileName}`}
              className="icon-button icon-button-sm"
              onClick={() => onDelete(document)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={13} />
            </button>
          )}
        </span>
      ),
    },
  ]

  return (
    <Card padding={false}>
      {canManage && (
        <div className="panel-toolbar panel-toolbar-padded">
          <Button onClick={onUpload} size="sm">
            <Upload aria-hidden="true" size={13} /> Upload document
          </Button>
        </div>
      )}
      <Table
        caption="Land documents"
        columns={columns}
        emptyMessage={canManage ? 'No documents yet. Upload the passbook, survey map or sale deed.' : 'No documents have been uploaded for this farm.'}
        getRowKey={(document) => document.id}
        rows={documents}
      />
    </Card>
  )
}
