const dotenv = require('dotenv')

dotenv.config({
  path: process.env.DOTENV || '.env.prod'
})

// TODO: what is interval for again?
export interface BotConfig {
  interval: number
  blockMaturity: number
  bypassKrakenApi: boolean
  cashSource: string
  dcaEnabled: boolean
  goal: number
  goalStart: number
  fee: number
  krakenApiKey: string
  krakenApiSecret: string
  minBet: number
  maxBet: number
  minConfidence: number
  mongoDb: string
  pair: string
  reserve: number
  slackBotToken: string
  slackChannel: string
  stakingThreshold: number
  targetProfitAmount: number
  targetProfitPercentage: number
}

export const config: BotConfig = {
  blockMaturity: process.env.BLOCK_MATURITY ? parseFloat(process.env.BLOCK_MATURITY) : 0.5,
  bypassKrakenApi: process.env.BYPASS_KRAKEN_API === 'true' ? true : false,
  cashSource: process.env.CASH_SOURCE || 'ZUSD', // USDF
  dcaEnabled: process.env.DCA_ENABLED === 'true' ? true : false,
  goal: process.env.GOAL ? parseFloat(process.env.GOAL) : 0,
  goalStart: process.env.GOAL_START ? parseFloat(process.env.GOAL_START) : 0,
  fee: process.env.FEE ? parseFloat(process.env.FEE) : 0.0016,
  interval: process.env.INTERVAL ? parseFloat(process.env.INTERVAL) : 15,
  krakenApiKey: process.env.KRAKEN_API_KEY || '',
  krakenApiSecret: process.env.KRAKEN_API_SECRET || '',
  minBet: process.env.MIN_BET ? parseFloat(process.env.MIN_BET) : 500,
  maxBet: process.env.MAX_BET ? parseFloat(process.env.MAX_BET) : 500,
  minConfidence: process.env.MIN_CONFIDENCE ? parseFloat(process.env.MIN_CONFIDENCE) : 0.5,
  mongoDb: process.env.MONGO || 'mongodb://localhost:27017/kraken-prod',
  pair: process.env.PAIR || '',
  reserve: process.env.RESERVE ? parseFloat(process.env.RESERVE) : 0,
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  slackChannel: process.env.SLACK_CHANNEL || '',
  stakingThreshold: process.env.STAKING_THRESHOLD ? parseFloat(process.env.STAKING_THRESHOLD) : 0.96,
  targetProfitAmount: process.env.TARGET_PROFIT_AMOUNT ? parseFloat(process.env.TARGET_PROFIT_AMOUNT) : 20,
  targetProfitPercentage: process.env.TARGET_PROFIT_PERCENTAGE ? parseFloat(process.env.TARGET_PROFIT_PERCENTAGE) : 0.04,
}
