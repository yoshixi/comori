import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function LoginScreen(): React.JSX.Element {
  const { login, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (): Promise<void> => {
    setError(null)
    try {
      await login()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Shuchu</CardTitle>
          <CardDescription>Sign in to manage your tasks and track your time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Clerk'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You will be redirected to sign in with your account
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
