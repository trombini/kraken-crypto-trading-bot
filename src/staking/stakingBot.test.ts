import { determineIfStake, determineIfUnstake } from './stakingBot'

describe('StakingBot', () => {

  it('Should stake position', async () => {
    const threshold = 0.95
    const result = determineIfStake(threshold, 90, 100) // because it is more than 10% below
    expect(result).toBe(true)
  })

  it('Should NOT YET stake position', async () => {
    const threshold = 0.95
    const result = determineIfStake(threshold, 95, 100) // because it is less than 10% below
    expect(result).toBe(false)
  })

  it('Should unsteak position as it is close to being sold', async () => {
    const threshold = 0.95
    const result = determineIfUnstake(threshold, 95, 100)
    expect(result).toBe(true)
  })

  it('Should unsteak position as it is close to being sold', async () => {
    const threshold = 0.95
    const result = determineIfUnstake(threshold, 0.91101900, 0.9514) // 0.958 (0.911/0.95) > 0.95
    expect(result).toBe(true)
  })

  it('Should unsteak position as it is already in the win zone', async () => {
    const threshold = 0.95
    const result = determineIfUnstake(threshold, 105, 100)
    expect(result).toBe(true)
  })

  it('Should NOT YET unsteak position', async () => {
    const threshold = 0.95
    const result = determineIfUnstake(threshold, 100, 120)
    expect(result).toBe(false)
  })
})
