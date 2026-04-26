import { useCallback, useEffect, useState } from 'react'

function computeBounds(): { from: number; to: number } {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const start = Math.floor(d.getTime() / 1000)
  return { from: start, to: start + 86400 }
}

/** Local calendar day as Unix seconds (from inclusive, to exclusive). Refreshes every minute. */
export function useLocalDayBounds(): { from: number; to: number } {
  const [bounds, setBounds] = useState(computeBounds)
  const refresh = useCallback(() => setBounds(computeBounds()), [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

  return bounds
}
