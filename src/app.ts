import { KrakenApi } from './krakenApi'
import { Watcher } from './watcher'
import { Analyst } from './analyst'
import { BotConfig } from './interfaces/botConfig.interface'
import { KrakenService } from './krakenService'
import { Bot } from './bot'
import { MockKrakenService } from './mockKrakenService'

// TODO: find a better way how to run a script forever
setInterval(() => { }, 10000)

const config: BotConfig = {
  interval: 15,
  pair: 'ADAUSD',
  blockMaturity: 0.75
}

console.log(config)

const key = ''
const secret = ''
const krakenApi = new KrakenApi(key, secret)
const krakenService = new MockKrakenService(krakenApi, config)
//const krakenService = new KrakenService(krakenApi, config)
const watcher = new Watcher(krakenService, config)
const analyst = new Analyst(watcher, config)
const bot = new Bot(krakenService, analyst)

setTimeout(() => {
  watcher.start()
}, 1000)













// const onFoo = new TypedEvent<Foo>();
// const onBar = new TypedEvent<Bar>();

// // Emit: 
// onFoo.emit(foo);
// onBar.emit(bar);
// // Listen: 
// onFoo.on((foo)=>console.log(foo));
// onBar.on((bar)=>console.log(bar));



// const eventEmitter = new events.EventEmitter()
// eventEmitter.on('WATCHER:NEW_PRICE', () => {
//   console.log('I hear a scream!')
// })


// setTimeout(() => {
//   watcher.start()
// }, 1000)



// (async () => {

//   const key = '...'
//   const secret = '...'
//   const kraken = new KrakenApi(key, secret)

//   const interval = 15
//   const pair = 
//   const start = moment().subtract(12, 'h').unix()

//   watcher.start()

//   // const c = await closes(kraken, pair, interval, start)
//   // const m = _.takeRight(macd(c), 5)
//   //console.log(m)

//   //const up = macdUpTrend([-1, -2, -3, -2])
//   //console.log(up)

//   //console.log(m)
// })()
