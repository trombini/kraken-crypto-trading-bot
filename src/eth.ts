import { AssetWatcher } from './assetWatcher/assetWatcher'
import { buyBotFactory, takeFullProfitBotFactory } from './bots/factory'
import { config } from './common/config'
import { formatMoney, formatNumber, generatePositionId } from './common/utils'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { PositionsService } from './positions/positions.service'
import { round } from 'lodash'
import { DcaService } from './common/dca'
import connect from './common/db/connect'
import KrakenClient from 'kraken-api'
import { createLaunchDarklyService } from './launchDarkly/launchdarkly.service'

(async function () {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const dcaService = new DcaService(config, positionsService)
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)
  const watcher = new AssetWatcher(krakenService, config)
  const killswitch = createLaunchDarklyService()

  //
  if (config.goal > 0) {
    await positionsService
      .find({
        pair: config.pair,
        status: 'sold',
      })
      .then((positions) => {
        const profit = positions.reduce((acc, p) => {
          const profit = (p?.buy?.volume || 0) - (p?.sell?.volume || 0)
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
              `Start watching sell opportunity for ${generatePositionId(position)}`,
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

  // Initiate Bots
  buyBotFactory(watcher, krakenService, positionsService, dcaService, killswitch, config)
  takeFullProfitBotFactory(watcher, krakenService, positionsService, killswitch, config)
})()
