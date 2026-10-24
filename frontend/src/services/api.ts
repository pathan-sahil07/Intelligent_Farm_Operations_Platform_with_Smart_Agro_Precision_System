const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface Crop {
  id: number;
  name: string;
  variety: string | null;
  field_name: string;
  area_acres: number;
  planting_date: string;
  expected_harvest_date: string | null;
  growth_stage: 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Mature';
  status: 'Active' | 'Harvested' | 'Cancelled';
  notes: string | null;
}

export interface IrrigationSchedule {
  id: number;
  crop_id: number;
  crop_name?: string;
  scheduled_date: string;
  scheduled_time: string | null;
  water_liters: number;
  method: string;
  status: 'Scheduled' | 'Completed' | 'Skipped';
  notes: string | null;
}

export interface HarvestRecord {
  id: number;
  crop_id: number | null;
  crop_name: string;
  harvest_date: string;
  quantity_kg: number;
  quality: string | null;
  notes: string | null;
}

export const api = {
  getCrops: () => request<Crop[]>('/crops'),

  createCrop: (data: {
    name: string;
    variety?: string;
    field_name: string;
    area_acres: number;
    planting_date: string;
    expected_harvest_date?: string;
    growth_stage?: Crop['growth_stage'];
    notes?: string;
  }) => request<Crop>('/crops', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateCropStage: (id: number, growth_stage: Crop['growth_stage']) =>
    request<Crop>(`/crops/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ growth_stage }),
    }),

  recordHarvest: (id: number, data: {
    harvest_date: string;
    quantity_kg: number;
    quality?: string;
    notes?: string;
  }) => request<HarvestRecord>(`/crops/${id}/harvest`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getIrrigation: () => request<IrrigationSchedule[]>('/irrigation'),

  createIrrigation: (data: {
    crop_id: number;
    scheduled_date: string;
    scheduled_time?: string;
    water_liters: number;
    method?: string;
    notes?: string;
  }) => request<IrrigationSchedule>('/irrigation', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateIrrigationStatus: (
    id: number,
    status: IrrigationSchedule['status'],
  ) => request<IrrigationSchedule>(`/irrigation/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  getHarvests: () => request<HarvestRecord[]>('/harvests'),
};
