import { createRequire } from 'node:module'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

const require = createRequire(import.meta.url)

/**
 * Default `pino` resolves to the Node build (SonicBoom → fs.write). That throws
 * `[unenv] fs.write is not implemented yet!` on Cloudflare Workers. Alias to
 * `pino/browser` (console-only) so source can stay `import pino from 'pino'` like main.
 */
export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()],
  resolve: {
    alias: {
      pino: require.resolve('pino/browser'),
    },
  },
})
