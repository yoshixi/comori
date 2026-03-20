/**
 * User-scoped OAuth service.
 *
 * Handlers use this service (via `c.get('oauth')`) instead of importing
 * `getMainDb()` directly. All queries are pre-scoped to a single user.
 */
import { getMainDb } from './internal/main-db'
import type { DB } from './common.db'
import {
  getOAuthTokenForAccount,
  listOAuthAccounts,
  listOAuthAccountRecords,
  updateOAuthToken,
  type UpdateOAuthToken,
} from './oauth.db'
import type { ProviderType, OAuthAccount } from './oauth.core'
import type { SelectAccount } from '../db/schema/schema'

export interface OAuthService {
  getTokenForAccount(
    providerType: ProviderType,
    accountId: string
  ): Promise<SelectAccount | null>

  listAccounts(providerType: ProviderType): Promise<OAuthAccount[]>

  listAccountRecords(providerType: ProviderType): Promise<SelectAccount[]>

  updateToken(
    providerType: ProviderType,
    accountId: string,
    data: UpdateOAuthToken
  ): Promise<SelectAccount | null>
}

export function createOAuthService(userId: number, overrideDb?: DB): OAuthService {
  const db = overrideDb ?? getMainDb()

  return {
    getTokenForAccount(providerType, accountId) {
      return getOAuthTokenForAccount(db, userId, providerType, accountId)
    },

    listAccounts(providerType) {
      return listOAuthAccounts(db, userId, providerType)
    },

    listAccountRecords(providerType) {
      return listOAuthAccountRecords(db, userId, providerType)
    },

    updateToken(providerType, accountId, data) {
      return updateOAuthToken(db, userId, providerType, accountId, data)
    },
  }
}
