import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Keyboard, Info } from 'lucide-react'

const keyboardShortcuts = [
  { keys: ['⌘', 'N'], description: 'Create a new task' },
  { keys: ['⌘', 'E'], description: 'Toggle sidebar' },
  { keys: ['Space'], description: 'Toggle timer for selected task' },
  { keys: ['Tab'], description: 'Navigate to next task' },
  { keys: ['Shift', 'Tab'], description: 'Navigate to previous task' }
]

export function SettingsView(): React.JSX.Element {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
      <p className="mt-2 text-muted-foreground">
        Configure your Shuchu experience.
      </p>

      <div className="mt-8 space-y-6">
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
