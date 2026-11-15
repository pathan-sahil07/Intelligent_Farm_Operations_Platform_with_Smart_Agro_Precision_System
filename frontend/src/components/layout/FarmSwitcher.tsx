import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Plus, Warehouse } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useFarm } from '@/contexts/useFarm'

/** Styled replacement for a native <select>: shows the active farm and lets the user switch. */
export function FarmSwitcher() {
  const { farms, farm, farmId, setFarmId } = useFarm()
  const { can } = useAuth()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (farms.length === 0) {
    return can('FARM_WRITE') ? (
      <Link to="/farms" className="inline-flex items-center gap-2 rounded-lg border border-dashed border-brand-500 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
        <Plus size={16} aria-hidden="true" /> Add your first farm
      </Link>
    ) : <span className="text-sm text-neutral-500">No farms assigned yet</span>
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white py-1.5 pr-3 pl-2 text-left shadow-sm transition hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <span className="grid size-8 place-items-center rounded-md bg-brand-50 text-brand-600"><Warehouse size={17} aria-hidden="true" /></span>
        <span className="leading-tight">
          <span className="block text-[11px] font-medium tracking-wide text-neutral-500 uppercase">Farm</span>
          <span className="block max-w-44 truncate text-sm font-semibold text-neutral-900">{farm?.name ?? 'Select a farm'}</span>
        </span>
        <ChevronDown size={16} className={`text-neutral-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <ul role="listbox" aria-label="Select farm" className="max-h-72 overflow-y-auto p-1.5">
            {farms.map((f) => {
              const active = f.id === farmId
              return (
                <li key={f.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => { setFarmId(f.id); setOpen(false) }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50 ${active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-neutral-800'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{f.name}</span>
                    </span>
                    {active && <Check size={16} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Link to="/farms" onClick={() => setOpen(false)} className="block border-t border-neutral-100 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-neutral-50">
            Manage farms
          </Link>
        </div>
      )}
    </div>
  )
}
