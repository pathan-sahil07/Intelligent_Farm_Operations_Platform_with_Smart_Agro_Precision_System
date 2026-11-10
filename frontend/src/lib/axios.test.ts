import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, NETWORK_MESSAGE, VALIDATION_MESSAGE, toApiError } from './axios'

const withResponse = (status: number, data: unknown) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never } as AxiosResponse)

describe('toApiError', () => {
  it('maps a missing response to the network message', () => {
    const e = toApiError(new AxiosError('down', 'ERR_NETWORK'))
    expect(e.status).toBe(0)
    expect(e.message).toBe(NETWORK_MESSAGE)
  })
  it('uses the server message', () => {
    const e = toApiError(withResponse(409, { message: 'Irrigation overlaps another schedule' }))
    expect(e.status).toBe(409)
    expect(e.message).toBe('Irrigation overlaps another schedule')
  })
  it('exposes field errors for validation failures', () => {
    const e = toApiError(withResponse(400, { message: { name: 'must not be blank' } }))
    expect(e.message).toBe(VALIDATION_MESSAGE)
    expect(e.fieldErrors).toEqual({ name: 'must not be blank' })
  })
  it('hides server internals on 500', () => {
    expect(toApiError(withResponse(500, { message: undefined })).message).toMatch(/server had a problem/)
  })
  it('explains 503 and 403', () => {
    expect(toApiError(withResponse(503, {})).message).toMatch(/unavailable/)
    expect(toApiError(withResponse(403, {})).message).toMatch(/permission/)
  })
  it('returns ApiError instances unchanged', () => {
    const original = new ApiError(404, 'nope')
    expect(toApiError(original)).toBe(original)
  })
})
