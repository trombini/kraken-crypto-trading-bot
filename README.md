# kraken-cypto-trading-bot


```
cp .env.dist .env.prod
npm run start
```






## Kraken API

**Order**

```json
{
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
```