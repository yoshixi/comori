import pino from 'pino'
import type { Logger } from 'pino'

export type { Logger } from 'pino'

// Lazy-initialise so pino is not created at module (global) scope.
// CF Workers forbid I/O (including console.log) outside handlers.
let _logger: Logger | undefined

function getLogger(): Logger {
  if (!_logger) {
    _logger = pino({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      timestamp: pino.stdTimeFunctions.isoTime,
      serializers: {
        err: pino.stdSerializers.err,
      },
      browser: {
        write: (o) => {
          console.log(JSON.stringify(o))
        },
      },
    })
  }
  return _logger
}

export const rootLogger: Logger = new Proxy({} as Logger, {
  get(_target, prop, receiver) {
    return Reflect.get(getLogger(), prop, receiver)
  },
})
