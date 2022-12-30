
import winston from 'winston'

// const myFormat = winston.format.printf(({ level, message, timestamp , ...metadata}) => {
//   let msg = `${timestamp} [${level}] ${message} `
//   if(metadata) {
// 	  //msg += JSON.stringify(metadata)
//   }
//   return msg
// })

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label ? label : ''}] ${level}: ${message}`
})

export const logger = winston.createLogger({
  level: 'debug',
  defaultMeta: { xservice: 'user-service' },
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.splat(),
    winston.format.timestamp(),
    myFormat
  )
})

// TODO: where should we log to in case of testing?
if (process.env.NODE_ENV === 'test') {
  logger.add(new winston.transports.Console())
  logger.add(new winston.transports.File({ filename: 'all.log' }))
}
else {
  logger.add(new winston.transports.Console())
}

export const Logger = (label: string): winston.Logger => logger.child({ label })


// export const xx = (context: string) => {

//   return logger.child({ requestId: '451' });

//   const logger = winston.createLogger({
//     level: 'debug',
//     format: winston.format.combine(
//       winston.format.colorize({ all: true }),
//       winston.format.splat(),
//       winston.format.timestamp(),
//       myFormat
//     )
//   })

//   return logger
// }
