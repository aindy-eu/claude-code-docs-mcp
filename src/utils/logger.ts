/**
 * Simple logger utility
 */

export const logger = {
  info: (...args: unknown[]) => console.info('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.info('[DEBUG]', ...args);
    }
  }
};
