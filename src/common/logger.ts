
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
})

if (process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}
