import winston from 'winston';
import { getRequestId } from './requestContext.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const validLevels = Object.keys(levels);

const defaultLevelForEnv = () => {
  const env = process.env.NODE_ENV || 'development';
  // Changed from "info" to "http" so priority 3 (http) logs pass in staging/production
  return env === 'development' ? 'debug' : 'http';
};

const level = () => {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured && validLevels.includes(configured)) {
    return configured;
  }
  return defaultLevelForEnv();
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'grey',
};

winston.addColors(colors);

/** Dev: human-readable with colors and optional metadata */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}${stackStr}`;
  }),
);

/** Production: JSON for parsing and querying */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'iso' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const withRequestId = winston.format((info) => {
  const requestIdFromContext = getRequestId();
  if (requestIdFromContext && !info.requestId) {
    info.requestId = requestIdFromContext;
  }
  return info;
});

const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(withRequestId(), productionFormat)
      : winston.format.combine(withRequestId(), devFormat),
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export interface LogContext {
  requestId?: string;
  userId?: string;
  loanId?: string;
  [key: string]: unknown;
}

const withContext = (context: LogContext = {}) => {
  const requestId = context.requestId || getRequestId();
  const baseMeta: Record<string, unknown> = {};

  if (requestId) baseMeta.requestId = requestId;
  if (context.userId) baseMeta.userId = context.userId;
  if (context.loanId) baseMeta.loanId = context.loanId;

  return {
    info: (message: string, meta?: unknown) => logger.info(message, { ...baseMeta, ...(meta as Record<string, unknown>) }),
    warn: (message: string, meta?: unknown) => logger.warn(message, { ...baseMeta, ...(meta as Record<string, unknown>) }),
    error: (message: string, meta?: unknown) => logger.error(message, { ...baseMeta, ...(meta as Record<string, unknown>) }),
    http: (message: string, meta?: unknown) => logger.http(message, { ...baseMeta, ...(meta as Record<string, unknown>) }),
  };
};

const loggerWithContext = Object.assign(logger, { withContext });

export default loggerWithContext;
