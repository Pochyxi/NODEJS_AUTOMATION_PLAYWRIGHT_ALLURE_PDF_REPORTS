import { createLogger, format, transports } from 'winston';
import path from 'path';
import clc from 'cli-color';

const { combine, timestamp, printf, colorize } = format;

// Funzione per ottenere il nome del file chiamante
const getCallerFile = (): string => {
    const originalFunc = Error.prepareStackTrace;

    let callerfile: string | undefined;
    try {
        const err = new Error();
        let currentfile: string | undefined;

        Error.prepareStackTrace = function (err, stack) {
            return stack;
        };
        if (err.stack) {
            const stack = err.stack as unknown as any[];
            currentfile = stack[2]?.getFileName();

            while (stack.length) {
                callerfile = stack.shift()?.getFileName();

                if (currentfile !== callerfile && callerfile !== undefined) break;
            }
        }
    } catch (e) {
        console.error('Error while retrieving caller file:', e);
    } finally {
        Error.prepareStackTrace = originalFunc;
    }

    return callerfile ? path.basename(callerfile) : 'unknown';
};

// Definizione del formato del log
const logFormat = printf(({ level, message, timestamp }) => {
    const callerFile = getCallerFile();
    let levelSymbol = '';
    let coloredMessage = message;

    // Colora i messaggi in base al livello
    if (level.includes('error')) {
        levelSymbol = '❗';
        coloredMessage = clc.red(message);
    } else if (level.includes('warn')) {
        levelSymbol = '⚠️';
        coloredMessage = clc.yellow(message);
    } else if (level.includes('info')) {
        levelSymbol = 'ℹ️';
        coloredMessage = clc.green(message);
    } else if (level.includes('debug')) {
        levelSymbol = '🐛';
        coloredMessage = clc.blue(message);
    } else {
        levelSymbol = '🔍';
        coloredMessage = clc.white(message);
    }

    return `${timestamp} ${levelSymbol} [${level}]: (${callerFile}) ${coloredMessage}`;
});

// Creazione del logger
const logger = createLogger({
    level: 'debug',
    format: combine(
        colorize(),
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console(), // Mostra i log in console
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' })
    ]
});

export default logger;
