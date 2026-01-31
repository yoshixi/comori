import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { onAuthRequired } from '../lib/api/mutator'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const authenticated = await window.api.auth.isAuthenticated()
        setIsAuthenticated(authenticated)
      } catch (error) {
        console.error('Failed to check auth status:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Listen for auth state changes from main process
  useEffect(() => {
    const unsubscribe = window.api.auth.onAuthStateChange((authenticated) => {
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Listen for 401 responses from API calls
  useEffect(() => {
    const unsubscribe = onAuthRequired(() => {
      setIsAuthenticated(false)
    })

    return unsubscribe
  }, [])

  const login = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const result = await window.api.auth.login()
      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }
      // Auth state will be updated via onAuthStateChange callback
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await window.api.auth.logout()
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
