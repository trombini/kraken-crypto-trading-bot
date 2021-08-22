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


// TODO fix me
// 2021-08-21T11:46:56.447Z [[34mdebug[39m] [34mBuyAnalyst, required signals: true, confidence: 0.45, summary: [{"required":true,"name":"UPSWING 15m","weight":0,"confidence":1},{"required":false,"name":"RSI 4h","weight":0.45,"confidence":1},{"required":false,"name":"UPTREND 4h","weight":0.45,"confidence":0},{"required":false,"name":"STOCHF 4h","weight":0.1,"confidence":0}][39m 
//   2021-08-21T11:46:56.447Z [[32minfo[39m] [32mBUY SIGNAL detected for [ADAUSD] with confidence 0.45[39m 
//   2021-08-21T11:46:56.448Z [[34mdebug[39m] [34mCreate new BUY order for ADAUSD[39m 
//   2021-08-21T11:46:56.461Z [[34mdebug[39m] [34mAnalyse period 1440 min[39m 
//   2021-08-21T11:46:56.463Z [[34mdebug[39m] [34mUPSWING: [ -0.004833 | -0.005952 | -0.005462 ] -> 1[39m 
//   2021-08-21T11:46:56.463Z [[34mdebug[39m] [34mRSI: [ 61.21 ] => 1[39m 
//   2021-08-21T11:46:56.468Z [[34mdebug[39m] [34mUPTREND: [ 0.026978 | 0.021966 | 0.012222 ] -> 0[39m 
//   2021-08-21T11:46:56.469Z [[34mdebug[39m] [34mSTOCHASTIC: [ k: 72.65 | d: 80.84 ] => 0[39m 
//   2021-08-21T11:46:56.469Z [[34mdebug[39m] [34mBuyAnalyst, required signals: true, confidence: 0.45, summary: [{"required":true,"name":"UPSWING 15m","weight":0,"confidence":1},{"required":false,"name":"RSI 4h","weight":0.45,"confidence":1},{"required":false,"name":"UPTREND 4h","weight":0.45,"confidence":0},{"required":false,"name":"STOCHF 4h","weight":0.1,"confidence":0}][39m 
//   2021-08-21T11:46:57.036Z [[34mdebug[39m] [34mCurrent ASK price for ADAUSD is '2.435370'[39m 
//   2021-08-21T11:46:57.042Z [[34mdebug[39m] [34mCalculate risk with availableAmount: 5021.07, reserve: 2000, maxBet: 2800[39m 
//   2021-08-21T11:46:57.045Z [[32minfo[39m] [32mCreate BUY order. confidence: 0.45, risk: $ 1,260.00, volume: 517[39m 
//   2021-08-21T11:46:57.306Z [[34mdebug[39m] [34mCreated BUY orderIds: [{"id":"OFQUGC-VXMCT-RN6CXY"}][39m 
//   2021-08-21T11:46:57.387Z [[34mdebug[39m] [34mFetch order details for orders 'OFQUGC-VXMCT-RN6CXY'[39m 
//   2021-08-21T11:46:57.628Z [[34mdebug[39m] [34mFetch order details for order 'OFQUGC-VXMCT-RN6CXY'[39m 
//   2021-08-21T11:46:57.629Z [[34mdebug[39m] [34mProcessed BUY order: {"refid":null,"userref":0,"status":"open","opentm":1629546417.2712,"starttm":0,"expiretm":0,"descr":{"pair":"ADAUSD","type":"buy","ordertype":"market","price":"0","price2":"0","leverage":"none","order":"buy 517.00000000 ADAUSD @ market","close":""},"vol":"517.00000000","vol_exec":"0.00000000","cost":"0.000000","fee":"0.000000","price":"0.000000","stopprice":"0.000000","limitprice":"0.000000","misc":"","oflags":"fciq"}[39m 
//   2021-08-21T11:46:57.654Z [[32minfo[39m] [32mBUY order created. volume: 0, price: 0[39m 
//   2021-08-21T11:46:57.663Z [[32minfo[39m] [32mRun DCA[39m 
//   2021-08-21T11:47:26.417Z [[34mdebug[39m] [34mAnalyse period 240 min[39m 


(async function () {
  console.log(config)

  setInterval(() => {}, 10000)

  await connect(config.mongoDb)

  const positionsService = new PositionsService()
  const dcaService = new DcaService(positionsService)
  const krakenApi = new KrakenClient(config.krakenApiKey, config.krakenApiSecret)
  const krakenService = new KrakenService(krakenApi, config)
  const watcher = new AssetWatcher(krakenService, config)

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
  buyBotFactory(watcher, krakenService, positionsService, dcaService, config)
  takeProfitBotFactory(watcher, krakenService, positionsService, config)
  //fullProfitBotFactory(watcher, krakenService, positionsService, config)
})()
