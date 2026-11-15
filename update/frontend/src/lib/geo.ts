/** Small geodesic helpers for farm-sized shapes (a few hundred metres to a few km across). */
export interface LngLat { lat: number; lng: number }

export const SQ_M_PER_ACRE = 4046.8564224
const EARTH_RADIUS_M = 6_371_008.8

function toMeters(points: LngLat[], origin: LngLat) {
  const cos = Math.cos((origin.lat * Math.PI) / 180)
  return points.map((p) => ({
    x: EARTH_RADIUS_M * ((p.lng - origin.lng) * Math.PI / 180) * cos,
    y: EARTH_RADIUS_M * ((p.lat - origin.lat) * Math.PI / 180),
  }))
}

export function centroid(points: LngLat[]): LngLat {
  const n = points.length || 1
  return { lat: points.reduce((s, p) => s + p.lat, 0) / n, lng: points.reduce((s, p) => s + p.lng, 0) / n }
}

/** Area of a polygon (open ring) in acres. */
export function areaAcres(points: LngLat[]): number {
  if (points.length < 3) return 0
  const m = toMeters(points, centroid(points))
  let sum = 0
  for (let i = 0; i < m.length; i++) {
    const a = m[i]
    const b = m[(i + 1) % m.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2 / SQ_M_PER_ACRE
}

/** A square of exactly `acres` acres centred on `center` (north-aligned). */
export function squareForAcres(center: LngLat, acres: number): LngLat[] {
  const half = Math.sqrt(acres * SQ_M_PER_ACRE) / 2
  const dLat = (half / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng = dLat / Math.cos((center.lat * Math.PI) / 180)
  return [
    { lat: center.lat + dLat, lng: center.lng - dLng },
    { lat: center.lat + dLat, lng: center.lng + dLng },
    { lat: center.lat - dLat, lng: center.lng + dLng },
    { lat: center.lat - dLat, lng: center.lng - dLng },
  ]
}

/** Scale a polygon about its centroid so its area becomes `acres`. */
export function scaleToAcres(points: LngLat[], acres: number): LngLat[] {
  const current = areaAcres(points)
  if (current <= 0) return points
  const k = Math.sqrt(acres / current)
  const c = centroid(points)
  return points.map((p) => ({ lat: c.lat + (p.lat - c.lat) * k, lng: c.lng + (p.lng - c.lng) * k }))
}

/** How far a drawn area is from the declared one, as a fraction (0.1 = 10%). */
export function relativeDifference(drawn: number, declared: number): number {
  return declared > 0 ? Math.abs(drawn - declared) / declared : Infinity
}

export const AREA_TOLERANCE = 0.1
