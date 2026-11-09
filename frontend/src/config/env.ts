/** Base URL of the Spring API. Defaults to the same origin, which Vite and nginx proxy to the backend. */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || '/api').replace(/\/+$/, '')
export const TOKEN_STORAGE_KEY = 'farmverse.token'
export const FARM_STORAGE_KEY = 'farmverse.selectedFarmId'
