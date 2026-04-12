import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'techo-mobile-plan-log-mode'

export type PlanLogMode = 'plan' | 'log'

export function useTodayPlanLogMode(): {
  mode: PlanLogMode
  setMode: (m: PlanLogMode) => void
} {
  const [mode, setModeState] = useState<PlanLogMode>('plan')

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'plan' || v === 'log') setModeState(v)
    })
  }, [])

  const setMode = useCallback((m: PlanLogMode) => {
    setModeState(m)
    void AsyncStorage.setItem(STORAGE_KEY, m)
  }, [])

  return { mode, setMode }
}
