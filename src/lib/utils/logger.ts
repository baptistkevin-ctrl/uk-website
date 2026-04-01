/**
 * Solaris Structured Logger
 *
 * Replaces scattered console.log/error with structured, consistent logging.
 * Every log entry includes timestamp, level, context, and structured data.
 *
 * Usage:
 *   const log = logger.child({ context: 'webhook:stripe' })
 *   log.info('Order created', { orderId, total })
 *   log.error('Payment failed', { sessionId, error: err.message })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: Record<string, unknown>
}

interface LoggerOptions {
  context: string
}

// Log level priority for filtering
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// Minimum log level from env — defaults to 'debug' in dev, 'info' in prod
const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function formatEntry(entry: LogEntry): string {
  const { timestamp, level, context, message, data } = entry
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`
  const dataStr = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ''
  return `${prefix} ${message}${dataStr}`
}

function createLogMethod(context: string, level: LogLevel) {
  return (message: string, data?: Record<string, unknown>) => {
    if (!shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    }

    const formatted = formatEntry(entry)

    switch (level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
      case 'fatal':
        console.error(formatted)
        break
    }
  }
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, data?: Record<string, unknown>) => void
  fatal: (message: string, data?: Record<string, unknown>) => void
  child: (options: LoggerOptions) => Logger
}

function createLogger(context: string): Logger {
  return {
    debug: createLogMethod(context, 'debug'),
    info: createLogMethod(context, 'info'),
    warn: createLogMethod(context, 'warn'),
    error: createLogMethod(context, 'error'),
    fatal: createLogMethod(context, 'fatal'),
    child: (options: LoggerOptions) => createLogger(`${context}:${options.context}`),
  }
}

/**
 * Root logger — create child loggers for each module.
 *
 * const log = logger.child({ context: 'orders' })
 * log.info('Order placed', { orderNumber: 'FG-123' })
 *
 * Output: [2026-04-02T12:00:00Z] [INFO] [app:orders] Order placed {"orderNumber":"FG-123"}
 */
export const logger = createLogger('app')
