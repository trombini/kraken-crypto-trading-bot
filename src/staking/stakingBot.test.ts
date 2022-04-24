import { determineIfStake, determineIfUnstake } from "./stakingBot"

describe('StakingBot', () => {

  it('Should stake position', async () => {
    const result = determineIfStake(90, 100) // because it is more than 10% below
    expect(result).toBe(true)
  })

  it('Should NOT YET stake position', async () => {
    const result = determineIfStake(95, 100) // because it is less than 10% below
    expect(result).toBe(false)
  })

  it('Should unsteak position as it is close to being sold', async () => {
    const result = determineIfUnstake(95, 100)
    expect(result).toBe(true)
  })

  it('Should unsteak position as it is already in the win zone', async () => {
    const result = determineIfUnstake(105, 100)
    expect(result).toBe(true)
  })

  it('Should NOT YET unsteak position', async () => {
    const result = determineIfUnstake(100, 120)
    expect(result).toBe(false)
  })

  it('Should NOT YET unsteak position', async () => {
    const result = determineIfUnstake(0.88517800, 0.9514)
    expect(result).toBe(false)
  })
})
