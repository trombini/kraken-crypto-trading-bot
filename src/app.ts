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
import { FeatureToggleService, createFeatureToggleService } from './featureToggle/featureToggle.service'
import { StakingBot } from './staking/stakingBot'
import { createAPI } from './krakenPlus'
import connect from './common/db/connect'
import KrakenClient from 'kraken-api'
import moment from 'moment'
import { createProfitLossService } from './profit/profitLoss.service'


const sleep = (ms: number, input: string) => {
  return new Promise((resolve) => {
    console.log('sleep', input)
    setTimeout(resolve, ms)
  })
}

// (async function () {

  // const inputs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  // for await(const i of inputs) {
  //   await sleep(3000, i)
  // }

  // const krakenApi = createAPI(config.krakenApiKey, config.krakenApiSecret)
  // krakenApi.staking.stake(10)
  // krakenApi.staking.stake(10)
  // krakenApi.staking.stake(10)
  // krakenApi.staking.stake(10)
  // await sleep(10000)

// })()


(async function () {

  const logger = Logger('Main')

  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const krakenApi = createAPI(config.krakenApiKey, config.krakenApiSecret)
  const krakenClient = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const kraken = new KrakenService(krakenClient, config)

  const positionsService = new PositionsService()
  const dcaService = new DcaService(config, positionsService)
  const watcher = new AssetWatcher(kraken, krakenApi, config)
  const profitLossService = createProfitLossService(positionsService, config)

  createRecoveryService(positionsService, dcaService, kraken, config)

  // make sure we check killswitch when starting up. just for fun
  const killswitch = createFeatureToggleService()
  await killswitch.buyEnabled()
  await killswitch.sellEnabled()
  setInterval(async () => {
    await killswitch.buyEnabled()
    await killswitch.sellEnabled()
  }, 60000)


  // calculate profit
  if (config.goal > 0) {
    await profitLossService.getProfitLoss()
    setInterval(profitLossService.getProfitLoss, 300000)
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
