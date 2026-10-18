import type { Logger } from 'shop-qua';

function write(level: string, scope: string, message: string, data?: unknown) {
  const line = `${new Date().toISOString()} ${level.padEnd(5)} [${scope}] ${message}`;
  const out = level === 'ERROR' ? console.error : console.log;
  data === undefined ? out(line) : out(line, data);
}

export function createLogger(scope: string): Logger {
  return {
    info: (message, data) => write('INFO', scope, message, data),
    warn: (message, data) => write('WARN', scope, message, data),
    error: (message, data) => write('ERROR', scope, message, data),
  };
}
