/**
 * Server-side logger with environment-aware log levels.
 * In production, only errors and warnings are logged.
 * In development, all log levels are enabled.
 *
 * Usage:
 *   import { serverLog } from '@/lib/logger'
 *   serverLog.info('[CANCEL API]', 'Parsed records:', count)
 *   serverLog.error('[CANCEL API]', 'Failed:', error)
 */

const isDev = process.env.NODE_ENV !== 'production'

export const serverLog = {
    /** Always logged — real errors */
    error: (...args: unknown[]) => console.error(...args),

    /** Always logged — warnings */
    warn: (...args: unknown[]) => console.warn(...args),

    /** Development only — info messages */
    info: (...args: unknown[]) => { if (isDev) console.log(...args) },

    /** Development only — debug messages */
    debug: (...args: unknown[]) => { if (isDev) console.log(...args) },
}
