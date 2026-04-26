import { getEnv } from '../../../core/env'

const DEFAULT_MOBILE_REDIRECT_URIS = [
  'techoo://auth-callback',
  'techoo://link-callback',
  'exp+techoo://auth-callback',
  'exp+techoo://link-callback'
]

const normalizeRedirectUri = (redirectUri: string) =>
  redirectUri.trim().replace(/\/$/, '')

export const getAllowedMobileRedirectUris = () => {
  const env = getEnv()
  const raw = env.MOBILE_REDIRECT_URIS
  if (!raw) return DEFAULT_MOBILE_REDIRECT_URIS
  return raw
    .split(',')
    .map((value) => normalizeRedirectUri(value))
    .filter(Boolean)
}

/**
 * Native / dev-client deep links: techoo://auth-callback or exp+techoo://auth-callback
 * (hostname is the path segment in URI terms).
 */
function isCustomSchemeDeepLink(uri: string): boolean {
  try {
    const u = new URL(uri)
    const scheme = u.protocol.replace(/:$/, '')
    const host = u.hostname
    if (host !== 'auth-callback' && host !== 'link-callback') return false
    if (u.pathname !== '' && u.pathname !== '/') return false
    return scheme === 'techoo' || scheme === 'exp+techoo'
  } catch {
    return false
  }
}

/** Expo Go / Metro dev: exp://192.168.x.x:8081/--/auth-callback */
const EXPO_GO_PATHS = new Set(['/--/auth-callback', '/--/link-callback'])

function isExpoGoStyleRedirect(uri: string): boolean {
  try {
    const u = new URL(uri)
    if (u.protocol !== 'exp:') return false
    if (!EXPO_GO_PATHS.has(u.pathname)) return false
    return isLikelyExpoDevHost(u.hostname)
  } catch {
    return false
  }
}

/**
 * Limit exp:// redirects to typical dev/tunnel hosts so we do not redirect session
 * codes to arbitrary internet hostnames.
 */
function isLikelyExpoDevHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (hostname.endsWith('.exp.direct')) return true
  if (hostname.endsWith('.expo.dev')) return true
  if (hostname.endsWith('.lan')) return true
  // Private IPv4 (LAN + common emulator setups)
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true
  return false
}

export const isAllowedMobileRedirectUri = (redirectUri: string) => {
  const normalized = normalizeRedirectUri(redirectUri)
  const allowed = getAllowedMobileRedirectUris()
  if (allowed.includes(normalized)) return true
  if (isCustomSchemeDeepLink(normalized)) return true
  if (isExpoGoStyleRedirect(normalized)) return true
  return false
}
