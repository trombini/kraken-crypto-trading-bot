import { Position } from './interfaces/trade.interface'
import fs from 'fs'
import { logger } from './common/logger'

const filePath = () => `positions.${process.env.NODE_ENV || 'prod' }.json`

export class PositionsService {

  data: Position[]

  constructor() {
    this.data = []

    fs.access(filePath(), (err) => {
      if(err) {
        fs.writeFile(filePath(), '', (err) => { })
      }
    })
  }

  async add(position: Position) {
    this.data.push(position)
    return this.writeDataToDisk()
  }

  async delete(position: Position) {
    this.data = this.data.filter(p => p.id !== position.id)
    return this.writeDataToDisk()
  }

  async findAll() {
    return this.loadDataFromDisk()
  }

  async writeDataToDisk() {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath(), JSON.stringify(this.data, undefined, 2), { encoding: 'utf8', flag: 'w+' }, (err) => {
        if (err) {
          logger.error(`Was not able to store positions.json because of: ${err.message}`)
          reject(err)
        }
        resolve(undefined)
      })
    })
  }

  async loadDataFromDisk(): Promise<Position[]> {
    return new Promise(resolve => {
      fs.access(filePath(), (err) => {
        if(!err) {
          fs.readFile(filePath(), 'utf8', (err, data) => {
            resolve(JSON.parse(data))
          })
        }
      })
    })
  }
}
