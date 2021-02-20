import { logger } from '../common/logger'
import fs from 'fs'
import { Profit } from './profit.interface'

const filePath = () => `profits.${process.env.NODE_ENV || 'prod' }.json`

export class ProfitsRepo {

  init: Promise<any>
  data: Profit[]

  constructor() {
    this.data = []
    this.init = this.loadDataFromDisk().then(position => {
      this.data = position
    })
  }

  async add(position: Profit) {
    return this.init.then(_ => {
      this.data.push(position)
      return this.writeDataToDisk()
    })
  }


  // for now we always read from disk so that we can edit it on the fly if we need
  async findAll() {
    return this.init.then(_ => this.loadDataFromDisk())
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

  async loadDataFromDisk(): Promise<Profit[]> {
    return new Promise(resolve => {
      fs.readFile(filePath(), 'utf8', (err, data) => {
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
