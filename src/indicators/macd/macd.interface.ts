import { MACDOutput } from 'technicalindicators/declarations/moving_averages/MACD'

export interface MACDResult {
  blocks: MACDOutput[],
  period: number,
  headMaturity: number,
  isHeadMatured: boolean
}
