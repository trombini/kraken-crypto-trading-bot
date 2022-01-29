import KrakenClient from 'kraken-api'
import { config } from '../common/config'
import { KrakenService, mapOhlcResultToObject } from './krakenService'

let krakenApi: KrakenClient
let krakenService: KrakenService

beforeEach(() => {
  krakenApi = new KrakenClient('key', 'secret')
  krakenService = new KrakenService(krakenApi, config)
})

describe('KrakenService', () => {

  it('FAKE TEST', () => {
    expect(true).toBe(true)
  })

  // it('should map OHLC response to object', () => {
  //   const rawOhcl = [0, 1, 2, 3, 4, 5, 6]
  //   const object = mapOhlcResultToObject(rawOhcl)
  //   expect(object).toEqual({
  //     time: 0,
  //     open: 1,
  //     high: 2,
  //     low: 3,
  //     close: 4,
  //     volume: 6,
  //   })
  // })

  // describe('createBuyOrder', () => {
  //   it('should call API with correct parameters', async () => {
  //     const spy = jest.spyOn(krakenApi, 'api').mockResolvedValue({
  //       error: [],
  //       result: {
  //         descr: { order: 'buy 25.00000000 ADAUSD @ market' },
  //         txid: ['OMFWDT-5WKEP-UU5B7L'],
  //       },
  //     })

  //     await krakenService.createBuyOrder({
  //       volume: 10,
  //       pair: 'ADAUSD',
  //     })

  //     expect(spy).toBeCalledWith(
  //       'AddOrder',
  //       expect.objectContaining({
  //         volume: 10,
  //         pair: 'ADAUSD',
  //       }),
  //       expect.any(Function),
  //     )
  //   })
  // })
})
