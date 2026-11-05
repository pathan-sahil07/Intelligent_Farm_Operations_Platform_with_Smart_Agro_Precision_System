import type { TableProps } from './Table.types'

export function Table<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No records to show yet.',
  isLoading = false,
  error,
}: TableProps<Row>) {
  return (
    <div className="table-wrap">
      {isLoading ? (
        <p aria-live="polite" className="table-state">
          Loading records…
        </p>
      ) : error ? (
        <p className="table-state error" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="table-empty">{emptyMessage}</p>
      ) : (
        <table className="data-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
