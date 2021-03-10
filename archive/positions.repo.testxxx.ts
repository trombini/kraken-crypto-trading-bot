import { PositionsService } from './positions.repo'
import { Position } from './position.interface'
import { glob } from 'glob'
import moment from 'moment'
import fs from 'fs'
import { isString } from 'lodash'

let repo: PositionsService
let testFilePath: string

const createFakePosition = (volume?: number): Position => {
  return {
    id: moment().format(),
    pair: 'ada',
    price: 1,
    volume: volume || 100
  }
}

afterEach(() => {
  // make sure we start with a clean database
  glob('positions.test.*.json', {}, function (err, files) {
    files.forEach(f => fs.unlinkSync(f))
  })
})

beforeEach(() => {
  testFilePath = `positions.test.${moment().unix()}${moment().milliseconds()}.json`
  repo = new PositionsService(testFilePath)
})

describe('PositionsService', () => {

  it('should load positions from disk', (done) => {
    // Prepare local data storafe
    fs.writeFile(testFilePath, JSON.stringify([ createFakePosition(123) ]), async (err) => {
      // initiate position repo
      repo = new PositionsService(testFilePath)
      repo.add(createFakePosition()).then(_ => {
        fs.readFile(testFilePath, 'utf8', (err, data) => {
          const positions = JSON.parse(data)
          expect(positions.length).toBe(2)
          done()
        })
      })
    })
  })

  it('should write new position directly to disk', (done) => {
    const position = createFakePosition()
    repo.add(position).then(_ => {
      fs.readFile(testFilePath, 'utf8', (err, data) => {
        expect(JSON.parse(data)).toEqual([position])
        done()
      })
    })
  })

  it('should write new positions directly to disk', async (done) => {
    await repo.add(createFakePosition())
    await repo.add(createFakePosition())

    fs.readFile(testFilePath, 'utf8', (err, data) => {
      const positions = JSON.parse(data)
      expect(positions.length).toBe(2)
      done()
    })
  })

  it('should remove position and write emptry array to disk', async (done) => {
    const position = createFakePosition()
    await repo.add(position)
    await repo.delete(position)

    fs.readFile(testFilePath, 'utf8', (err, data) => {
      expect(JSON.parse(data)).toEqual([])
      done()
    })
  })
})
