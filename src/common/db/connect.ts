import { logger } from '../logger'
import mongoose from 'mongoose'

export default (uri: string) => {

  mongoose.connection.on('disconnected', () => {
    logger.error('disconnected from mongo')
  })

  return mongoose.connect(uri,  {

  }).then(() => {
      return logger.info(`Successfully connected to ${uri}`)
    }).catch((error) => {
      logger.error('Error connecting to database: ', error)
      return process.exit(1)
    })
}
