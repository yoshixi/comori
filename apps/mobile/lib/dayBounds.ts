/** Start of local calendar day (00:00). */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Unix [from, to) for that local day. */
export function dayBoundsUnix(d: Date): { from: number; to: number } {
  const s = startOfLocalDay(d)
  const from = Math.floor(s.getTime() / 1000)
  return { from, to: from + 86400 }
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Sunday-start week containing `anchor`. */
export function startOfWeekSunday(anchor: Date): Date {
  const s = startOfLocalDay(anchor)
  const day = s.getDay()
  s.setDate(s.getDate() - day)
  return s
}
