import { OHLCBlock } from 'src/krakenService'
import { getBlockMaturity, getMaturedBlocks } from './utils'
import { logger } from '../common/logger'
import { MACD } from 'technicalindicators'

export const calculateMACD = (period: number, blockMaturity: number, head: OHLCBlock, blocks: OHLCBlock[]) => {
  const headMaturity = getBlockMaturity(period, head)
  const maturedBlocks = getMaturedBlocks(period, blockMaturity, blocks)

  if(headMaturity < blockMaturity) {
    logger.debug(`MACD BUY: block maturity: ${headMaturity}. Needs to be above ${blockMaturity}.`)
  }

  const closes = maturedBlocks.map(b => b.close)
  return MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
}
