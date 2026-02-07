import { Clerk } from '@clerk/clerk-js'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required')
}

export const clerk = new Clerk(publishableKey)

let initialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize Clerk SDK.
 * Safe to call multiple times - will only initialize once.
 */
export async function initClerk(): Promise<void> {
  if (initialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = clerk.load().then(() => {
    initialized = true
  })

  return initPromise
}

/**
 * Check if Clerk is initialized and has an active session.
 */
export function isAuthenticated(): boolean {
  return initialized && clerk.session !== null && clerk.session !== undefined
}

/**
 * Get the current session token for API calls.
 * Returns null if not authenticated.
 */
export async function getSessionToken(): Promise<string | null> {
  if (!initialized || !clerk.session) {
    return null
  }

  try {
    const token = await clerk.session.getToken()
    return token
  } catch (error) {
    console.error('Failed to get session token:', error)
    return null
  }
}

/**
 * Start the OAuth sign-in flow.
 * Opens the system browser for Clerk authentication.
 */
export async function startOAuthFlow(): Promise<void> {
  if (!initialized) {
    await initClerk()
  }

  const redirectUrl = 'shuchu://auth/callback'

  // Use Clerk's sign-in with redirect for OAuth
  const signIn = clerk.client?.signIn
  if (!signIn) {
    throw new Error('Clerk client not available')
  }

  await signIn.authenticateWithRedirect({
    strategy: 'oauth_google',
    redirectUrl,
    redirectUrlComplete: redirectUrl
  })
}

/**
 * Handle the OAuth callback URL from the main process.
 * This is called when the app receives a deep link callback.
 */
export async function handleOAuthCallback(callbackUrl: string): Promise<boolean> {
  if (!initialized) {
    await initClerk()
  }

  try {
    // Clerk handles the callback internally when we call handleRedirectCallback
    // We need to pass the full URL for Clerk to process
    await clerk.handleRedirectCallback({
      redirectUrl: callbackUrl
    })

    return clerk.session !== null
  } catch (error) {
    console.error('Failed to handle OAuth callback:', error)
    return false
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (!initialized || !clerk.session) {
    return
  }

  try {
    await clerk.signOut()
  } catch (error) {
    console.error('Failed to sign out:', error)
  }
}

/**
 * Add a listener for session changes.
 * Returns an unsubscribe function.
 */
export function onSessionChange(callback: (session: typeof clerk.session) => void): () => void {
  const unsubscribe = clerk.addListener((resources) => {
    callback(resources.session)
  })

  return unsubscribe
}
