import { useCallback, useEffect, useState } from 'react'

export type RemoteError = Error & { status?: number }

export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<RemoteError>()
  const [loading, setLoading] = useState(true)
  const reload = useCallback(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    load(controller.signal)
      .then(setData)
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          setError(cause instanceof Error ? cause as RemoteError : new Error('Request failed'))
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [load])
  useEffect(() => {
    const timer = window.setTimeout(() => reload(), 0)
    return () => window.clearTimeout(timer)
  }, [reload])
  return { data, error, loading, reload }
}
