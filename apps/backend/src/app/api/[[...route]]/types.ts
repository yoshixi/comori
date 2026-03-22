import type { DB } from '../../core/common.db'
import type { OAuthService } from '../../core/oauth.service'

export type AppBindings = {
  Bindings: {}
  Variables: {
    user: { id: number; email: string; name: string }
    db: DB
    oauth: OAuthService
  }
}
