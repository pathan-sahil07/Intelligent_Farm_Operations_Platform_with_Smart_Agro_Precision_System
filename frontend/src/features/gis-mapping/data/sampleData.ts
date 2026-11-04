import type { SampleFarmMapData } from '../types/gis-mapping.types'

export const sampleFarmMapData: SampleFarmMapData = {
  fields: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          fieldId: 'MB-N01',
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
          fieldId: 'MB-R04',
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
          fieldId: 'MB-E07',
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
          fieldId: 'CS-S02',
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
