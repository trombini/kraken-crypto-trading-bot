import { AssetWatcher } from './assetWatcher/assetWatcher'
import { buyBotFactory, takeProfitBotFactory } from './bots/factory'
import { config } from './common/config'
import { formatMoney, formatNumber, positionId } from './common/utils'
import { KrakenService } from './kraken/krakenService'
import { logger } from './common/logger'
import { PositionsService } from './positions/positions.service'
import { round } from 'lodash'
import { DcaService } from './common/dca'
import connect from './common/db/connect'
import KrakenClient from 'kraken-api'
import { createRecoveryService } from './positions/recovery.service'
import { createLaunchDarklyService } from './launchDarkly/launchdarkly.service'
import { slack } from './slack/slack.service'


(async function () {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const dcaService = new DcaService(positionsService)
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const kraken = new KrakenService(krakenApi, config)
  const watcher = new AssetWatcher(kraken, config)
  const recoveryService = createRecoveryService(positionsService, kraken, config)
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

          // console.log(`${p?.buy?.volume} - ${p?.sell?.volume}`)
          // console.log(p)

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
              `Start watching sell opportunity for ${positionId(position)}`,
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
  buyBotFactory(watcher, kraken, positionsService, dcaService, killswitch, config)
  takeProfitBotFactory(watcher, kraken, positionsService, killswitch, config)
  //fullProfitBotFactory(watcher, kraken, positionsService, config)
})()
