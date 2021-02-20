import { PositionsService } from '../positions/positions.repo'
import { averaging } from '../positions/utils'

const positionsService = new PositionsService()

positionsService.findAll().then(positions => {
  const reducedPositions = averaging(0.02, positions)
  console.log(JSON.stringify(reducedPositions, undefined, 2))
})



const x = {
  refid: null,
  userref: 0,
  status: 'closed',
  reason: null,
  opentm: 1613557771.9805,
  closetm: 1613557771.9847,
  starttm: 0,
  expiretm: 0,
  descr: {
    pair: 'ADAUSD',
    type: 'sell',
    ordertype: 'market',
    price: '0',
    price2: '0',
    leverage: 'none',
    order: 'sell 4500.00000000 ADAUSD @ market',
    close: ''
  },
  vol: '4500.00000000',
  vol_exec: '4500.00000000',
  cost: '3902.192955',
  fee: '7.023948',
  price: '0.867154',
  stopprice: '0.000000',
  limitprice: '0.000000',
  misc: '',
  oflags: 'fciq'
}

console.log(JSON.stringify(x, undefined, 2))