import type { ReactNode } from 'react'

export interface TableColumn<Row> {
  key: string
  header: string
  render: (row: Row) => ReactNode
}

export interface TableProps<Row> {
  caption: string
  columns: TableColumn<Row>[]
  rows: Row[]
  getRowKey: (row: Row) => string | number
  emptyMessage?: string
  isLoading?: boolean
  error?: string
}
