
## Installation

```bash
$ npm install
$ cp env.dist .env.prod
```

Create a Mongodb Docker container
```
docker run -d --name mongo -p 27017:27017 mongo
```

```bash
docker run -d --name mongodb \
  -v ${pwd}:/data/db \
  -p 27017:27017 \
  mongo:latest
```

## Running the bot

```bash
# development
$ npm run dev

# debug mode
$ npm run dev:debug

# run
$ npm run start

# run with different config
$ DOTENV=.env.adausd npm run start
```

## Test

```bash
# unit tests
$ npm run test
$ npm run test:dev

# test coverage
$ npm run test:cov
```

## Configuration

| Key | Default | Description  |
| ------------- |:-------------:| -----:|
| BLOCK_MATURITY | 0.75 | The relative age in % of a block to be considered in the indicators (e.g. MACD) |
| BYPASS_KRAKEN_API | false | You will f*** up. Might be a good idea to have a kill switch |
| CASH_SOURCE | ZUSD | Source of funds to monitor and keep reserve. Doesn't match the pair unfortunately. |
| KRAKEN_API_KEY || API Key for Kraken |
| KRAKEN_API_SECRET || API Secret for Kraken |
| MAX_BET | 500 | How much are you willing to loose **each** bet? |
| MIN_CONFIDENCE | 0.6 | Minimum confidence before a Signal is triggered |
| MONGO | mongodb://localhost:27017/kraken-prod | URI for MongoDB |
| PAIR | ADAUSD | Coind to watch |
| RESERVE | 0 | Amount of money which will not be touched |
| SLACK_BOT_TOKEN || Slack Bot Token for Oauth |
| SLACK_CHANNEL || Slack Channel ID for updates |
| TARGET_PROFIT | 30 | Threshold to sell position |
| TAX | 0.0018 | Tax in % defined by Kraken |

## Scripts

### Dollar-cost averaging of open positions

Sometimes it makes sense to Dollar-cost average over all the open positions to increase the chance that a position can be closed successfully. That might be the case if the upswings are not as powerful and the position never switches into the WIN zone. By averaging the positions, the leverage does increase.

```
$ npm run average

[
  {
    "id": 1613800589,
    "pair": "ADAUSD",
    "volume": 1423,
    "price": 1.054792
  }
]
```


## Kraken API

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
