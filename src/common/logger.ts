
import winston from 'winston'

const myFormat = winston.format.printf(({ level, message, timestamp , ...metadata}) => {
  let msg = `${timestamp} [${level}] ${message} `
  if(metadata) {
	  //msg += JSON.stringify(metadata)
  }
  return msg
})

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.timestamp(),
    myFormat
  ),
  // transports: [
  //   new winston.transports.File({ filename: 'all.log' }),
  //   new winston.transports.File({ filename: 'debug.log', level: 'debug' }),
  //   new winston.transports.File({ filename: 'info.log', level: 'info' }),
  //   new winston.transports.File({ filename: 'error.log', level: 'error' }),
  // ],
})

// TODO: where should we log to in case of testing?
if (process.env.NODE_ENV === 'test') {
  logger.add(new winston.transports.Console())

  // logger.add(new winston.transports.File({ filename: 'all.log' }))
}
else {
  logger.add(new winston.transports.Console())
}
