import { takeRight, filter, round } from 'lodash'
import { OHLCBlock } from 'src/krakenService'
import moment from 'moment'

export const allNegatives = (values: number[]) => filter(values, (e) => e < 0).length == values.length

export const allPositives = (values: number[]) => filter(values, (e) => e > 0).length == values.length

export const getBlockMaturity = (interval: number, block?: OHLCBlock): number => {
  if(block) {
    const now = moment().unix()
    const age = now - block.time
    return round(age / (interval * 60), 2)
  }
  return 0
}

export const getMaturedBlocks = (interval: number, maturity: number, blocks: OHLCBlock[]) : OHLCBlock[] => {
  const now = moment().unix()
  const margin = (interval * 60) * maturity
  const threshold = now - margin
  return filter(blocks, o => o.time < threshold)
}
