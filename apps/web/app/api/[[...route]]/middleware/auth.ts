import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'

// Auth context type that will be set by the middleware
export interface AuthContext {
  userId: string      // Clerk user ID
  email?: string      // User's email (if available)
  sessionId?: string  // Clerk session ID
}

// Extend Hono's context to include auth
declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

/**
 * Auth middleware that verifies JWT tokens from Clerk.
 * Expects Authorization header with format: "Bearer <token>"
 *
 * On success: Sets auth context with userId, email, sessionId
 * On failure: Returns 401 Unauthorized
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      },
      401
    )
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix

  try {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) {
      console.error('CLERK_SECRET_KEY is not configured')
      return c.json(
        {
          error: 'Internal server error',
          message: 'Authentication service not configured'
        },
        500
      )
    }

    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, {
      secretKey,
    })

    // Extract user info from the verified token
    const authContext: AuthContext = {
      userId: payload.sub,  // subject claim is the Clerk user ID
      sessionId: payload.sid,
    }

    // Try to get email from claims if available
    if (payload.email) {
      authContext.email = payload.email as string
    }

    // Set auth context for handlers
    c.set('auth', authContext)

    await next()
  } catch (error) {
    console.error('Token verification failed:', error)
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      },
      401
    )
  }
})
