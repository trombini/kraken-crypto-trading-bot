import { PositionsService } from './positions.service'
import moment from 'moment'
import fs from 'fs'

const createFakePosition = () => {
  return {
    id: moment().unix(),
    pair: 'ada',
    price: 1,
    volume: 100,
    tax: 1
  }
}

afterEach(() => {
  // make sure we start with a clean database
  //fs.unlinkSync('positions.test.json')
})

describe('PositionsService', () => {

  it('should create local positions.json file if it doesnt exist yet', async (done) => {
    const repo = new PositionsService()
    setTimeout(() => {
      fs.access('positions.test.json', (err) => {
        expect(err).toBeNull()
        done()
      })
    }, 100)
  })

  it('should write new positions directly to disk', (done) => {
    const repo = new PositionsService()
    const position = createFakePosition()
    repo.add(position).then(_ => {
      fs.readFile('positions.test.json', 'utf8', (err, data) => {
        expect(JSON.parse(data)).toEqual([position])
        done()
      })
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
