import { BuyOrder, Trade } from './interfaces/trade.interface'
import { KrakenService } from './krakenService'
import { v4 as uuidv4 } from 'uuid'

export class MockKrakenService extends KrakenService {

  async buy(order: BuyOrder): Promise<Trade> {

    console.log(`BUY ${order.volume} for '${order.price ? order.price : 'market'}'`)

    return new Promise((resolve, reject) => {
      const price = 12
      if(order?.volume) {
        resolve({
          id: uuidv4(),
          pair: 'adausd',
          price: price,
          volume: order.volume,
          cost: order.volume * price,
          fee: (order.volume + 0.9) * 0.0018,
          tax: 0.0018,
        })
      }
      else {
        reject('Volume is missing')
      }
    })
  }
}
