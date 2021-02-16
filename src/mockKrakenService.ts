// import { BuyOrder, Trade } from './interfaces/trade.interface'
// import { KrakenService } from './krakenService'
// import { v4 as uuidv4 } from 'uuid'
// import moment from 'moment'

// export class MockKrakenService extends KrakenService {

//   async createBuyOrder(order: BuyOrder): Promise<Trade> {

//     return new Promise(resolve => {
//       if(order.volume) {
//         const tax = 0.0018
//         const price = Math.random()
//         const cost = price * order.volume
//         resolve({
//           id: uuidv4(),
//           time: moment().unix(),
//           pair: order.pair,
//           price: price,
//           volume: order.volume,
//           cost: cost,
//           fee: cost * tax,
//           tax: tax,
//         })
//       }
//     })
//   }
// }
