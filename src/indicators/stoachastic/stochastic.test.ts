import { MACDResult } from '../common/macdUtils'
import { mapOutputToConfindence } from './stochastic'

describe('Stochastic Fast', () => {

  it('should return high conficence as K value is below D', () => {
    const confidence = mapOutputToConfindence(1, 2)
    expect(confidence).toBe(0.8)
  })

  it('should return middle conficence as K value is below D', () => {
    const confidence = mapOutputToConfindence(1, 5)
    expect(confidence).toBe(0.5)
  })


  it('should fail as K value is way below D', () => {
    const confidence = mapOutputToConfindence(1, 8)
    expect(confidence).toBe(0)
  })

  it('should be extremely confident as K value is way above D', () => {
    const confidence = mapOutputToConfindence(100, 10)
    expect(confidence).toBe(1)
  })

})
