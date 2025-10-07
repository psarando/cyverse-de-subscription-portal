/**
 * @author johnworth, psarando
 */
import { createLogger, format, transports } from "winston";

// Can't use next/config here due to circular dependency in next.config.ts
const logLevel = process.env.SP_LOG_LEVEL || "info";
const logLabel = process.env.SP_LOG_LABEL || "subscription-portal";

const { combine, timestamp, label, printf, splat } = format;

const logFormat = printf(
    ({ level, message, label, timestamp }) =>
        `${timestamp} [${label}] ${level}: ${message}`,
);

const logger = createLogger({
    level: logLevel,
    format: combine(
        splat(),
        label({ label: logLabel }),
        timestamp(),
        logFormat,
    ),
    transports: [new transports.Console()],
});

logger.debug(
    'Logger initialized with "%s" level and "%s" label.',
    logLevel,
    logLabel,
);

export default logger;
