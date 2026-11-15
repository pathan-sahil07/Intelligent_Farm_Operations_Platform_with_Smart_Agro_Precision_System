import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWith } from '@/test/helpers'

vi.mock('@/contexts/useFarm', () => ({ useFarm: () => ({ farmId: 7, farm: { id: 7, name: 'Green Acres' }, farms: [], loading: false, setFarmId: () => undefined }) }))
let impl: () => Promise<unknown> = () => Promise.resolve([])
const calls: unknown[][] = []
vi.mock('@/api/endpoints', async (orig) => {
  const mod = await orig<typeof import('@/api/endpoints')>()
  return {
    ...mod,
    cropApi: { ...mod.cropApi, list: (...a: unknown[]) => { calls.push(a); return impl() }, harvests: () => Promise.resolve([]) },
    farmDataApi: { ...mod.farmDataApi, plots: () => Promise.resolve([]) },
  }
})
import CropsPage from './CropsPage'

const crop = { id: 1, name: 'Wheat', variety: 'HD-2967', farm_id: 7, plot_id: null, field_name: 'North', area_acres: 4, planting_date: '2026-10-01', expected_harvest_date: null, growth_stage: 'Seedling', status: 'Active', notes: null }

describe('CropsPage', () => {
  beforeEach(() => { calls.length = 0; impl = () => Promise.resolve([]) })
  it('lists crops for the selected farm and offers Add for writers', async () => {
    impl = () => Promise.resolve([crop])
    renderWith(<CropsPage />, { auth: { role: 'FARM_OWNER' } })
    expect(await screen.findByText(/Wheat/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add crop/i })).toBeInTheDocument()
    expect(calls[0][0]).toMatchObject({ farmId: 7 })
  })
  it('hides write actions for read-only roles', async () => {
    impl = () => Promise.resolve([crop])
    renderWith(<CropsPage />, { auth: { role: 'FIELD_WORKER' } })
    expect(await screen.findByText(/Wheat/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add crop/i })).not.toBeInTheDocument()
  })
  it('shows an error state when the API fails', async () => {
    impl = () => Promise.reject(new Error('backend down'))
    renderWith(<CropsPage />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
