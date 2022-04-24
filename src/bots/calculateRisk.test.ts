import { calculateRisk, caluclateVolume } from './buyBot'

beforeEach(() => {

})

describe('Calculate Risk', () => {

  it('should fail because we would touch our RESERVE', async () => {
    const minBet = 0
    const maxBet = 0
    const confidence = 1

    const reserveAmount = 100
    const availableAmount = 50
    expect(() => {
      calculateRisk(reserveAmount, availableAmount, minBet, maxBet, confidence)
    }).toThrow(`totalAvailabeFunds (-50) is below zero. We want to keep reserve of: 100`)
  })

  it('should fail because the calculated risk is less than MIN_BET', async () => {
    const reserveAmount = 0
    const availableAmount = 400
    const minBet = 200
    const maxBet = 1000
    const confidence = 1

    expect(() => {
      calculateRisk(reserveAmount, availableAmount, minBet, maxBet, confidence)
    }).toThrow(`risk (100) is less than minBet (200)`)
  })

  it('should cap the risk at MAX_BET', async () => {
    const reserveAmount = 0
    const availableAmount = 10000
    const minBet = 0
    const maxBet = 2000
    const confidence = 1

    const risk = calculateRisk(reserveAmount, availableAmount, minBet, maxBet, confidence)
    expect(risk).toBe(2000) // = maxBet
  })


  it('should calculate correct RISK (funds > maxRisk)', async () => {
    const reserveAmount = 0
    const availableAmount = 1000
    const minBet = 0
    const maxRisk = 200
    const confidence = 0.5

    const risk = calculateRisk(reserveAmount, availableAmount, minBet, maxRisk, confidence)
    expect(risk).toBe(100)
  })

  it('should cap the risk at 25% (funds < maxRisk)', async () => {
    const reserveAmount = 0
    const availableAmount = 1000
    const minBet = 0
    const maxBet = 2000
    const confidence = 1

    const risk = calculateRisk(reserveAmount, availableAmount, minBet, maxBet, confidence)
    expect(risk).toBe(250) // 25% of 1000
  })

  it('should calculate correct RISK (funds < maxRisk)', async () => {
    const reserveAmount = 0
    const availableAmount = 1000
    const minBet = 0
    const maxRisk = 2000
    const confidence = 0.5

    const risk = calculateRisk(reserveAmount, availableAmount, minBet, maxRisk, confidence)
    expect(risk).toBe(125)
  })

  it('should calculate correct volume based on last ask price', async () => {
    const volume = caluclateVolume(1000, 2)
    expect(volume).toBe(500)
  })

})
