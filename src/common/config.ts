
// load correct config file
const env = process.env.NODE_ENV || 'prod'
require('dotenv').config({ path: `.env.${env}` })

// TODO: what is interval for again?

export interface BotConfig {
  interval: number
  blockMaturity: number
  bypassKrakenApi: boolean
  goal: number
  goalStart: number
  krakenApiKey: string
  krakenApiSecret: string
  maxBet: number
  pair: string
  slackBotToken: string
  slackChannel: string
  targetProfit: number
  tax: number
}

export const config: BotConfig = {
  interval: process.env.INTERVAL ? parseFloat(process.env.INTERVAL) : 15,
  blockMaturity: process.env.BLOCK_MATURITY ? parseFloat(process.env.BLOCK_MATURITY) : 0.75,
  bypassKrakenApi: process.env.BYPASS_KRAKEN_API === 'true' ? true : false,
  goal: process.env.GOAL ? parseFloat(process.env.GOAL) : 0,
  goalStart: process.env.GOAL_START ? parseFloat(process.env.GOAL_START) : 0,
  krakenApiKey: process.env.KRAKEN_API_KEY || '',
  krakenApiSecret: process.env.KRAKEN_API_SECRET || '',
  maxBet: process.env.MAX_BET ? parseFloat(process.env.MAX_BET) : 500,
  pair: process.env.PAIR || '',
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  slackChannel: process.env.SLACK_CHANNEL || '',
  targetProfit: process.env.TARGET_PROFIT ? parseFloat(process.env.TARGET_PROFIT) : 30,
  tax: process.env.TAX ? parseFloat(process.env.TAX) : 0.0018,
}
