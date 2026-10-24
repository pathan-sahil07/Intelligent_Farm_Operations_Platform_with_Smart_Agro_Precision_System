import type { FarmMapData } from '../types/gis-mapping.types'

export const sampleFarmMapData: FarmMapData = {
  farms: [
    {
      id: 'farm-demo-01',
      name: 'Meadowbrook Farm',
      location: 'Central Valley, California',
      coordinates: { latitude: 36.7384, longitude: -119.7902 },
      areaAcres: 84,
    },
    {
      id: 'farm-demo-02',
      name: 'Creekside Farm',
      location: 'Central Valley, California',
      coordinates: { latitude: 36.7352, longitude: -119.7828 },
      areaAcres: 42,
    },
  ],
  fields: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          farmId: 'farm-demo-01',
          fieldId: 'MB-N01',
          name: 'North Orchard',
          areaAcres: 32,
          crop: 'Apple',
          irrigationStatus: 'Scheduled',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.7940, 36.7401],
            [-119.7915, 36.7401],
            [-119.7915, 36.7420],
            [-119.7940, 36.7420],
            [-119.7940, 36.7401],
          ]],
        },
      },
      {
        type: 'Feature',
        properties: {
          farmId: 'farm-demo-01',
          fieldId: 'MB-R04',
          name: 'River Field',
          areaAcres: 28,
          crop: 'Sweet corn',
          irrigationStatus: 'Up to date',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.7902, 36.7376],
            [-119.7877, 36.7376],
            [-119.7877, 36.7395],
            [-119.7902, 36.7395],
            [-119.7902, 36.7376],
          ]],
        },
      },
      {
        type: 'Feature',
        properties: {
          farmId: 'farm-demo-01',
          fieldId: 'MB-E07',
          name: 'East Field',
          areaAcres: 24,
          crop: 'Tomato',
          irrigationStatus: 'Needs irrigation',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.7856, 36.7390],
            [-119.7831, 36.7390],
            [-119.7831, 36.7409],
            [-119.7856, 36.7409],
            [-119.7856, 36.7390],
          ]],
        },
      },
      {
        type: 'Feature',
        properties: {
          farmId: 'farm-demo-02',
          fieldId: 'CS-S02',
          name: 'South Plot',
          areaAcres: 18,
          crop: 'Cover crop',
          irrigationStatus: 'Scheduled',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.7843, 36.7338],
            [-119.7818, 36.7338],
            [-119.7818, 36.7357],
            [-119.7843, 36.7357],
            [-119.7843, 36.7338],
          ]],
        },
      },
    ],
  },
}
