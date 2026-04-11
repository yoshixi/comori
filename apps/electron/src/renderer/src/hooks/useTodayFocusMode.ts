import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'techo-today-focus-mode'

export type TodayFocusMode = 'plan' | 'work'

function readStoredMode(): TodayFocusMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'plan' || v === 'work') return v
  } catch {
    /* ignore */
  }
  return 'plan'
}

/**
 * Plan = calendar-first; Work = log-first. Persisted in localStorage (V2).
 */
export function useTodayFocusMode(): {
  focusMode: TodayFocusMode
  setFocusMode: (mode: TodayFocusMode) => void
  toggleFocusMode: () => void
} {
  const [focusMode, setFocusModeState] = useState<TodayFocusMode>(readStoredMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, focusMode)
    } catch {
      /* ignore */
    }
  }, [focusMode])

  const setFocusMode = useCallback((mode: TodayFocusMode) => {
    setFocusModeState(mode)
  }, [])

  const toggleFocusMode = useCallback(() => {
    setFocusModeState((m) => (m === 'plan' ? 'work' : 'plan'))
  }, [])

  return { focusMode, setFocusMode, toggleFocusMode }
}
