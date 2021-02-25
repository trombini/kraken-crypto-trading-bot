import { logger } from '../logger'
import mongoose from 'mongoose'

export default (db: string) => {

  mongoose.connection.on('disconnected', () => {
    logger.error('disconnected from mongo')
  })

  return mongoose.connect(db,  {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    }).then(() => {
      return logger.info(`Successfully connected to ${db}`)
    }).catch((error) => {
      logger.error('Error connecting to database: ', error)
      return process.exit(1)
    })
}
