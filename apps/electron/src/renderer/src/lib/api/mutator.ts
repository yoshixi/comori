// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface CustomRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  params?: Record<string, string | number | boolean | null | undefined | string[]>
  data?: unknown
  headers?: Record<string, string>
  responseType?: 'json' | 'text'
}

// Event for handling 401 responses (auth required)
const authRequiredListeners: Set<() => void> = new Set()

export function onAuthRequired(callback: () => void): () => void {
  authRequiredListeners.add(callback)
  return () => {
    authRequiredListeners.delete(callback)
  }
}

function notifyAuthRequired(): void {
  authRequiredListeners.forEach((callback) => callback())
}

/**
 * Custom HTTP client for Electron renderer process
 * This function will be used by the generated API client
 */
export const customInstance = async <T>(config: CustomRequestConfig): Promise<T> => {
  const url = new URL(config.url, API_BASE_URL)
  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          url.searchParams.append(key, String(entry))
        })
        return
      }
      url.searchParams.set(key, String(value))
    })
  }

  // Get auth token from main process
  const token = await window.api.auth.getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  // Add Authorization header if token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const requestConfig: RequestInit = {
    method: config.method || 'GET',
    headers,
    body: config.data ? JSON.stringify(config.data) : undefined
  }

  const response = await fetch(url.toString(), requestConfig)

  if (!response.ok) {
    // Handle 401 Unauthorized - notify listeners to trigger re-authentication
    if (response.status === 401) {
      notifyAuthRequired()
    }

    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return (await response.text()) as unknown as T
}

export default customInstance
