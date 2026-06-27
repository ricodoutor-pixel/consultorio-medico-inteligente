type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function serializeContext(context?: LogContext) {
  return context ? { ...context } : {};
}

export function createLogger(service: string): Logger {
  const prefix = `[${service}]`;

  return {
    info(message, context) {
      console.info(prefix, {
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...serializeContext(context),
      });
    },
    warn(message, context) {
      console.warn(prefix, {
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...serializeContext(context),
      });
    },
    error(message, context) {
      console.error(prefix, {
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        ...serializeContext(context),
      });
    },
  };
}

export const logger = createLogger('app');
