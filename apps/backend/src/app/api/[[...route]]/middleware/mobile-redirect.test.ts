import { describe, expect, it, vi } from 'vitest'
import { isAllowedMobileRedirectUri } from './mobile-redirect'

vi.mock('../../../core/env', () => ({
  getEnv: () => ({ MOBILE_REDIRECT_URIS: undefined })
}))

describe('isAllowedMobileRedirectUri', () => {

  it('allows default list entries', () => {
    expect(isAllowedMobileRedirectUri('techoo://auth-callback')).toBe(true)
    expect(isAllowedMobileRedirectUri('techoo://link-callback')).toBe(true)
    expect(isAllowedMobileRedirectUri('exp+techoo://auth-callback')).toBe(true)
  })

  it('allows Expo Go / Metro exp:// LAN URLs', () => {
    expect(isAllowedMobileRedirectUri('exp://192.168.1.42:8081/--/auth-callback')).toBe(true)
    expect(isAllowedMobileRedirectUri('exp://127.0.0.1:8081/--/link-callback')).toBe(true)
    expect(isAllowedMobileRedirectUri('exp://10.0.0.5:19000/--/auth-callback')).toBe(true)
  })

  it('allows Expo tunnel hosts', () => {
    expect(
      isAllowedMobileRedirectUri('exp://abc-8081.exp.direct/--/auth-callback')
    ).toBe(true)
  })

  it('rejects exp:// with wrong path', () => {
    expect(isAllowedMobileRedirectUri('exp://127.0.0.1:8081/--/evil')).toBe(false)
    expect(isAllowedMobileRedirectUri('exp://127.0.0.1:8081/auth-callback')).toBe(false)
  })

  it('rejects exp:// to public hostname', () => {
    expect(isAllowedMobileRedirectUri('exp://evil.com/--/auth-callback')).toBe(false)
  })

  it('trailing slash normalized for allow list', () => {
    expect(isAllowedMobileRedirectUri('techoo://auth-callback/')).toBe(true)
  })
})
