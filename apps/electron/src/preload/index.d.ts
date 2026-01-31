import { ElectronAPI } from '@electron-toolkit/preload'

interface TimerState {
  timerId: string
  taskId: string
  taskTitle: string
  startTime: string
}

type NotificationPermissionStatus = 'granted' | 'denied' | 'not-determined'

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthAPI {
  login: () => Promise<AuthResult>
  logout: () => Promise<AuthResult>
  getToken: () => Promise<string | null>
  isAuthenticated: () => Promise<boolean>
  onAuthStateChange: (callback: (authenticated: boolean) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: AuthAPI
      updateTimerStates: (timers: TimerState[]) => void
      onShowTaskDetail: (callback: (taskId: string) => void) => () => void
      onNotificationTimerStarted: (callback: (taskId: string) => void) => () => void
      onNotificationTimerStopped: (callback: (taskId: string) => void) => () => void
      getNotificationPermission: () => Promise<NotificationPermissionStatus>
      requestNotificationPermission: () => Promise<NotificationPermissionStatus>
      openNotificationSettings: () => Promise<void>
    }
  }
}
