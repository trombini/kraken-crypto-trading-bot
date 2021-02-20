import { PositionsService } from './positions.repo'
import { Position } from './position.interface'
import moment from 'moment'
import fs from 'fs'

const createFakePosition = (): Position => {
  return {
    id: moment().unix(),
    pair: 'ada',
    price: 1,
    volume: 100
  }
}

afterEach(() => {
  // make sure we start with a clean database
  fs.unlinkSync('positions.test.json')
})

describe('PositionsService', () => {

  it('should load positions from disk', (done) => {
    fs.writeFile('positions.test.json', JSON.stringify([ createFakePosition() ]), async (err) => {
      const repo = new PositionsService()
      repo.add(createFakePosition()).then(_ => {
        fs.readFile('positions.test.json', 'utf8', (err, data) => {
          const positions = JSON.parse(data)
          expect(positions.length).toBe(2)
          done()
        })
      })
    })
  })

  it('should write new position directly to disk', (done) => {
    const repo = new PositionsService()
    const position = createFakePosition()
    repo.add(position).then(_ => {
      fs.readFile('positions.test.json', 'utf8', (err, data) => {
        expect(JSON.parse(data)).toEqual([position])
        done()
      })
    })
  })

  it('should write new positions directly to disk', async (done) => {
    const repo = new PositionsService()

    await repo.add(createFakePosition())
    await repo.add(createFakePosition())

    fs.readFile('positions.test.json', 'utf8', (err, data) => {
      const positions = JSON.parse(data)
      expect(positions.length).toBe(2)
      done()
    })
  })

  it('should remove position and write emptry array to disk', async (done) => {
    const repo = new PositionsService()
    const position = createFakePosition()

    await repo.add(position)
    await repo.delete(position)

    fs.readFile('positions.test.json', 'utf8', (err, data) => {
      expect(JSON.parse(data)).toEqual([])
      done()
    })
  })
})
