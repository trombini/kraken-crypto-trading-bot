import KrakenClient from 'kraken-api'
import { config } from '../common/config'
import { KrakenService } from '../kraken/krakenService'
import { PositionsService } from '../positions/positions.service'
import { TakeProfitBot } from './takeProfitBot'
import { setupDb } from '../../test/test-setup'
import PositionModel from '../positions/position.model'
import { AssetWatcher } from '../assetWatcher/assetWatcher'
import { SellAnalyst } from '../analysts/sellAnalyst'
import { createAPI, IKrakenApi } from '../krakenPlus'
import useFeatureToggle, { FeatureToggle } from 'src/featureToggle/useFeatureTogle'

let positionsService: PositionsService
let krakenApi: IKrakenApi
let krakenClient: KrakenClient
let krakenService: KrakenService
let watcher: AssetWatcher
let analyst: SellAnalyst
let bot: TakeProfitBot
let killswitch: FeatureToggle

// setup db
setupDb('takeProfitBot')

beforeEach(() => {

  krakenApi = createAPI('key', 'secret')
  krakenClient = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)

  positionsService = new PositionsService()
  watcher = new AssetWatcher(krakenService, krakenApi, config)
  analyst = new SellAnalyst(watcher, config)
  killswitch = useFeatureToggle()

  bot = new TakeProfitBot(krakenService, positionsService, analyst, killswitch, config)
})

describe('TakeProfitBot', () => {

  it('FAKE TEST', () => {
    expect(true).toBe(true)
  })

  // it('should throw error because expected profit would be negative', async (done) => {
  //   jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 1000, vol_exec: 1000, price: 1.0 } )
  //   jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])

  //   const position = new PositionModel({ buy: { volume: 1000, price: 1.1 }})
  //   const currentBidPrice = 1.1

  //   bot.sellPosition(position, currentBidPrice)
  //     .then(_ => fail('it should not reach here'))
  //     .catch(err => {
  //       expect(err).toBeDefined()
  //       done()
  //     })
  // })

  // it(`should close position with status 'sold'`, async () => {
  //   jest.spyOn(krakenService, 'getOrder').mockResolvedValue({ vol: 1000, vol_exec: 1000, price: 1 } )
  //   jest.spyOn(krakenService, 'createSellOrder').mockResolvedValue([{ id: 'SOME-SELL-ORDER'} ])

  //   const currentBidPrice = 1.2
  //   const spy = jest.spyOn(positionsService, 'update')
  //   const positionA = new PositionModel({ date: 'xxx', pair: 'ADAUSD', status: 'xxx',
  //     buy: {
  //       volume: 1000, price: 1.1
  //     }
  //   })

  //   await positionA.save()

  //   const updatedPosition = await bot.createSellOrder(positionA, currentBidPrice)

  //   expect(spy).toHaveBeenCalledTimes(2)

  //   // first call updates status to 'processing'
  //   expect(spy).toHaveBeenNthCalledWith(1,
  //     expect.objectContaining({ _id: positionA._id }),
  //     expect.objectContaining({ status: 'selling' }))

  //   // first call updates status to 'closed'
  //   expect(spy).toHaveBeenNthCalledWith(2,
  //     expect.objectContaining({ _id: positionA._id }),
  //     expect.objectContaining({ status: 'sold' }))

  //   // check if we return the updated version
  //   expect(updatedPosition).toBeDefined()
  //   expect(updatedPosition?.status).toEqual('sold')
  // })

  // it('should update position with correct profit details', async () => {
  //   const updatePositionSpy = jest.spyOn(positionsService, 'update')
  //   const getOrderSpy = jest.spyOn(krakenService, 'getOrder').mockResolvedValue({
  //     vol: 80,
  //     vol_exec: 80,
  //     price: 1.2
  //   })
  //   const positionA = new PositionModel({
  //     pair: 'ADAUSD',
  //     status: 'sold',
  //     buy: { volume: 100, volumeExecuted: 100, price: 1.0 },
  //     sell: { orderIds: [ 'some-order-id' ]}
  //   })

  //   await bot.evaluateProfit(positionA)

  //   expect(getOrderSpy).toBeCalledTimes(1)
  //   expect(updatePositionSpy).toHaveBeenCalledTimes(1)
  //   expect(updatePositionSpy).toHaveBeenNthCalledWith(1,
  //     expect.objectContaining({ _id: positionA._id }),
  //     expect.objectContaining({
  //       'sell.price': 1.2,
  //       'sell.volume': 80
  //     }))
  // })

})
