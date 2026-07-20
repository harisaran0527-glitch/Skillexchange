import React from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  page?: number
  pages?: number
  onPageChange?: (p: number) => void
  total?: number
}

export default function DataTable<T extends { _id?: string }>({
  columns, data, loading, emptyMessage = 'No data found.',
  page = 1, pages = 1, onPageChange, total
}: DataTableProps<T>) {
  if (loading) return (
    <div className="space-y-3 p-4">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-12 rounded-xl admin-skeleton" />
      ))}
    </div>
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : data.map((row, i) => (
              <tr key={(row as any)._id || i} className="hover:bg-white/[0.03] transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-300 align-middle">
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 mt-2">
          <p className="text-xs text-slate-500">
            {total ? `${total} total records` : `Page ${page} of ${pages}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, pages - 4 + i))
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
