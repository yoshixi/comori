import { createRoute } from '@hono/zod-openapi'
import {
  OAuthStatusResponseModel,
  OAuthAuthUrlResponseModel,
  OAuthCallbackQueryModel,
  OAuthDisconnectResponseModel
} from '../../../core/oauth.core'
import { ErrorResponseModel } from '../../../core/common.core'

// GET /auth/google - Get authorization URL
export const getGoogleAuthUrlRoute = createRoute({
  method: 'get',
  path: '/auth/google',
  summary: 'Get Google OAuth authorization URL',
  description: 'Returns the URL to redirect the user to for Google OAuth authorization',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OAuthAuthUrlResponseModel
        }
      },
      description: 'Authorization URL generated successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Failed to generate authorization URL'
    }
  }
})

// GET /auth/google/callback - OAuth callback
export const googleAuthCallbackRoute = createRoute({
  method: 'get',
  path: '/auth/google/callback',
  summary: 'Google OAuth callback',
  description: 'Handles the OAuth callback from Google and exchanges the code for tokens',
  request: {
    query: OAuthCallbackQueryModel
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OAuthStatusResponseModel
        }
      },
      description: 'OAuth tokens stored successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Invalid callback parameters or authorization failed'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Failed to exchange code for tokens'
    }
  }
})

// GET /auth/google/status - Check OAuth status
export const getGoogleAuthStatusRoute = createRoute({
  method: 'get',
  path: '/auth/google/status',
  summary: 'Check Google OAuth status',
  description: 'Check if the user has a valid Google OAuth connection',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OAuthStatusResponseModel
        }
      },
      description: 'OAuth status retrieved successfully'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Failed to check OAuth status'
    }
  }
})

// DELETE /auth/google - Disconnect Google OAuth
export const deleteGoogleAuthRoute = createRoute({
  method: 'delete',
  path: '/auth/google',
  summary: 'Disconnect Google OAuth',
  description: 'Revokes the Google OAuth token and removes all associated calendar data',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OAuthDisconnectResponseModel
        }
      },
      description: 'Google OAuth disconnected successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'No Google OAuth connection found'
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseModel
        }
      },
      description: 'Failed to disconnect Google OAuth'
    }
  }
})
