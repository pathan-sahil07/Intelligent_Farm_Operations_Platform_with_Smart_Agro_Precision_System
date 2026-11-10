import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/axios'

/**
 * Helpers for write actions. After success the listed query keys are refetched.
 * - run: rethrows errors so a FormDialog/ConfirmAction can show them inline.
 * - act: swallows errors into a toast (for plain buttons).
 */
export function useRun(invalidate: string[]) {
  const qc = useQueryClient()
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T> => {
      const result = await fn()
      await Promise.all(invalidate.map((key) => qc.invalidateQueries({ queryKey: [key] })))
      if (success) toast.success(success)
      return result
    },
    [qc, invalidate],
  )
  const act = useCallback(
    async (fn: () => Promise<unknown>, success?: string) => {
      try {
        await run(fn, success)
      } catch (e) {
        toast.error(errorMessage(e))
      }
    },
    [run],
  )
  return { run, act }
}
