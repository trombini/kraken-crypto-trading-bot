
## Installation

```bash
$ npm install
$ cp .env.dist .env.prod
```


## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run dev

# debug mode
$ npm run dev:debug
```

## Test

```bash
# unit tests
$ npm run test
$ npm run test:dev

# test coverage
$ npm run test:cov
```


# Scripts

## Dollar-cost averaging of open positions

Sometimes it makes sense to Dollar-cost average over all the open positions to increase the chance that a position can be closed successfully. That might be the case if the upswings are not as powerful and the position never switches into the WIN zone. By averaging the positions, the leverage does increase.

```
node ./dist/src/scripts/averaging.js

[
  {
    "id": 1613800589,
    "pair": "ADAUSD",
    "volume": 1423,
    "price": 1.054792
  }
]
```


# Kraken API

**AddOrder**

URL: https://api.kraken.com/0/private/AddOrder

Response

```json
{
  "refid": null,
  "userref": 0,
  "status": "closed",
  "reason": null,
  "opentm": 1613557771.9805,
  "closetm": 1613557771.9847,
  "starttm": 0,
  "expiretm": 0,
  "descr": {
    "pair": "ADAUSD",
    "type": "sell",
    "ordertype": "market",
    "price": "0",
    "price2": "0",
    "leverage": "none",
    "order": "sell 4500.00000000 ADAUSD @ market",
    "close": ""
  },
  "vol": "4500.00000000",
  "vol_exec": "4500.00000000",
  "cost": "3902.192955",
  "fee": "7.023948",
  "price": "0.867154",
  "stopprice": "0.000000",
  "limitprice": "0.000000",
  "misc": "",
  "oflags": "fciq"
}
```
