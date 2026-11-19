import { describe, expect, it } from 'vitest'
import { AREA_TOLERANCE, areaAcres, relativeDifference, scaleToAcres, squareForAcres } from './geo'

const center = { lat: 13.6, lng: 79.4 }

describe('geo helpers', () => {
  it('builds a square whose area equals the requested acres', () => {
    for (const acres of [0.5, 3, 10, 120]) {
      expect(areaAcres(squareForAcres(center, acres))).toBeCloseTo(acres, 1)
    }
  })
  it('scales any shape to the target acres', () => {
    const triangle = [{ lat: 13.6, lng: 79.4 }, { lat: 13.601, lng: 79.4 }, { lat: 13.6, lng: 79.402 }]
    expect(areaAcres(scaleToAcres(triangle, 5))).toBeCloseTo(5, 1)
  })
  it('returns 0 for fewer than three points', () => {
    expect(areaAcres([center, center])).toBe(0)
  })
  it('measures tolerance against the declared size', () => {
    expect(relativeDifference(10.5, 10)).toBeLessThan(AREA_TOLERANCE)
    expect(relativeDifference(15, 10)).toBeGreaterThan(AREA_TOLERANCE)
  })
})
