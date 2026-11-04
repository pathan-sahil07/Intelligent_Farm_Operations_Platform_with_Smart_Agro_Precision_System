import { useEffect, useState } from 'react'

export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  useEffect(() => {
    let refreshTimer: number

    function scheduleNextRefresh() {
      window.clearTimeout(refreshTimer)
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const greetingBoundaries = [5, 12, 17, 21].map(
        (hour) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour),
      )
      const nextRefresh = [nextMidnight, ...greetingBoundaries]
        .filter((boundary) => boundary.getTime() > now.getTime())
        .reduce((earliest, boundary) =>
          boundary.getTime() < earliest.getTime() ? boundary : earliest,
        )
      const delay = nextRefresh.getTime() - now.getTime() + 50
      refreshTimer = window.setTimeout(refreshDate, delay)
    }

    function refreshDate() {
      setCurrentDate(new Date())
      scheduleNextRefresh()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshDate()
      }
    }

    scheduleNextRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return currentDate
}
