import { logger } from '../src/common/logger'
import { Position } from './position.interface'
import fs from 'fs'

// export const filePath = () => `positions.${process.env.NODE_ENV || 'prod' }.json`

export class PositionsService {

  filePath: string
  init: Promise<any>
  data: Position[]

  constructor(filePath?: string) {
    this.data = []
    this.filePath = filePath || `positions.${process.env.NODE_ENV || 'prod' }.json`
    this.init = this.loadDataFromDisk().then(position => {
      this.data = position
    })
  }

  async add(position: Position) {
    return this.init.then(_ => {
      this.data.push(position)
      return this.writeDataToDisk()
    })
  }

  async delete(position: Position) {
    return this.init.then(_ => {
      this.data = this.data.filter(p => p.id !== position.id)
      return this.writeDataToDisk()
    })
  }

  // for now we always read from disk so that we can edit it on the fly if we need
  async findAll() {
    return this.init.then(_ => this.loadDataFromDisk())
  }

  async writeDataToDisk() {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.filePath, JSON.stringify(this.data, undefined, 2), { encoding: 'utf8', flag: 'w+' }, (err) => {
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
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        try {
          resolve(JSON.parse(data))
        }
        catch(error) {
          resolve([])
        }
      })
    })
  }
}
