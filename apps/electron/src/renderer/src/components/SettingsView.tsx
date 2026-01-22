import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Keyboard, Info, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type NotificationPermissionStatus = 'granted' | 'denied' | 'not-determined'

const keyboardShortcuts = [
  { keys: ['⌘', 'N'], description: 'Create a new task' },
  { keys: ['⌘', 'E'], description: 'Toggle sidebar' },
  { keys: ['Space'], description: 'Toggle timer for selected task' },
  { keys: ['Tab'], description: 'Navigate to next task' },
  { keys: ['Shift', 'Tab'], description: 'Navigate to previous task' }
]

function NotificationStatusBadge({ status }: { status: NotificationPermissionStatus }): React.JSX.Element {
  switch (status) {
    case 'granted':
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Enabled</span>
        </div>
      )
    case 'denied':
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Disabled</span>
        </div>
      )
    case 'not-determined':
      return (
        <div className="flex items-center gap-1.5 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Not Set</span>
        </div>
      )
  }
}

export function SettingsView(): React.JSX.Element {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermissionStatus>('not-determined')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    // Check notification permission on mount
    window.api.getNotificationPermission().then(setNotificationStatus)
  }, [])

  const handleRequestPermission = async (): Promise<void> => {
    setIsRequesting(true)
    try {
      const status = await window.api.requestNotificationPermission()
      setNotificationStatus(status)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleOpenSettings = (): void => {
    window.api.openNotificationSettings()
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
      <p className="mt-2 text-muted-foreground">
        Configure your Shuchu experience.
      </p>

      <div className="mt-8 space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Get reminders when tasks are about to start or end
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Permission Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notificationStatus === 'granted'
                      ? 'You will receive task reminders'
                      : notificationStatus === 'denied'
                        ? 'Enable notifications in system settings'
                        : 'Allow notifications to receive task reminders'}
                  </p>
                </div>
                <NotificationStatusBadge status={notificationStatus} />
              </div>

              <div className="flex gap-2">
                {notificationStatus === 'not-determined' && (
                  <Button
                    size="sm"
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                  >
                    {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                  </Button>
                )}
                {notificationStatus === 'denied' && (
                  <Button size="sm" variant="outline" onClick={handleOpenSettings}>
                    Open System Settings
                  </Button>
                )}
                {notificationStatus === 'granted' && (
                  <Button size="sm" variant="outline" onClick={handleOpenSettings}>
                    Manage in System Settings
                  </Button>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Notification triggers:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>1 minute before a task starts</li>
                  <li>1 minute before a task ends</li>
                  <li>Option to snooze for 5, 15, or 30 minutes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              Quick actions to boost your productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-muted-foreground text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About
            </CardTitle>
            <CardDescription>
              Application information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application</span>
                <span>Shuchu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span>Focus-driven task management</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
