import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

// Safe stringify to handle circular references
const safeStringify = (obj: any): string => {
const seen = new WeakSet();
return JSON.stringify(obj, (key, value) => {
if (typeof value === 'object' && value !== null) {
if (seen.has(value)) {
return '[Circular]';
}
seen.add(value);
}
return value;
});
};

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
let log = `${timestamp} [${level}]: ${message} `;
if (Object.keys(metadata).length > 0) {
log += `| ${safeStringify(metadata)}`;
}
return log;
})

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "warn" : "debug",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
    transports: [

        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: "HH:mm:ss" }),
                logFormat
            ),
        }),

        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),

        new winston.transports.File({
            filename: "logs/combined.log",
        }),
    ],
});