import { AssetWatcher } from './assetWatcher/assetWatcher'
import { buyBotFactory, takeProfitBotFactory } from './bots/factory'
import { config } from './common/config'
import { formatMoney, formatNumber, generatePositionId } from './common/utils'
import { KrakenService } from './kraken/krakenService'
import { Logger } from './common/logger'
import { PositionsService } from './positions/positions.service'
import { round } from 'lodash'
import { DcaService } from './common/dca'
import { createRecoveryService } from './positions/recovery.service'
import { createLaunchDarklyService } from './launchDarkly/launchdarkly.service'
import { StakingBot } from './staking/stakingBot'
import { createAPI } from './krakenPlus'
import connect from './common/db/connect'
import KrakenClient from 'kraken-api'

(async function () {
  const logger = Logger('Main')

  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const dcaService = new DcaService(config, positionsService)
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const kraken = new KrakenService(krakenApi, config)
  const watcher = new AssetWatcher(kraken, config)
  const recoveryService = createRecoveryService(positionsService, dcaService, kraken, config)
  const killswitch = createLaunchDarklyService()

  // make sure we check killswitch when starting up. just for fun
  const enabled = await killswitch.tripped()

  // calculate profit
  if (config.goal > 0) {
    await positionsService
      .find({
        pair: config.pair,
        status: 'sold',
      })
      .then((positions) => {
        const profit = positions.reduce((acc, p) => {

          if(p?.sell?.volume === undefined && p?.sell?.volumeToKeep === undefined) {
            logger.error('ERROR IN LOG. NOT ALL INFOS')
            return acc
          }

          const profit = p?.sell?.volumeToKeep || 0
          // const profit = (p?.buy?.volume || 0) - (p?.sell?.volume || 0)
          return acc + profit
        }, 0)
        const totalProfit = config.goalStart + profit
        const goal = (totalProfit / config.goal) * 100
        logger.info(
          `Goal of ${formatMoney(config.goal)} reached by ${round(goal, 2,)} %  (${config.goalStart} + ${round(profit, 0)}) 🚀`,
        )
      })
  }

  //
  await positionsService
    .find({ pair: config.pair, status: 'open' })
    .then((positions) => {
      return positions.reduce(
        (acc, position) => {
          if (position.buy.price && position.buy.volume) {
            logger.info(
              `Start watching sell opportunity for ${generatePositionId(position)} ${position.staked ? '(staked)' : ''}`,
            )
            return {
              costs: acc.costs + position.buy.price * position.buy.volume,
              volume: acc.volume + position.buy.volume,
            }
          }
          return acc
        },
        { costs: 0, volume: 0 },
      )
    })
  .then(risk => {
    logger.info(
      `Currently at risk: ${formatMoney(risk.costs)} $ (${formatNumber(risk.volume)})`,
    )
  })

  //
  // start asset watcher
  watcher.start([5, 15, 240, 1440])
  //watcher.start([5, 15])

  // Staking bot
  const krakenApi2 = createAPI(config.krakenApiKey, config.krakenApiSecret)
  const stakingBot = new StakingBot(watcher, krakenApi2, positionsService, config)

  // Initiate Buy and Sell bots
  buyBotFactory(watcher, kraken, positionsService, dcaService, killswitch, config)
  takeProfitBotFactory(watcher, kraken, positionsService, killswitch, config)
  //fullProfitBotFactory(watcher, kraken, positionsService, config)
})()
