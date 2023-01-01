
import * as LaunchDarkly from 'launchdarkly-node-server-sdk'
import { Logger } from '../common/logger'

const logger = Logger('LaunchDarklyService')

export interface LaunchDarklyService {
  tripped(): Promise<boolean>
}

export function createLaunchDarklyService(): LaunchDarklyService {

  let promise: Promise<LaunchDarkly.LDClient>

  const getClient = (): Promise<LaunchDarkly.LDClient> => {
    if(!promise) {
      promise = new Promise((resolve) => {
        const ldClient = LaunchDarkly.init('sdk-fad3c3c9-5ffc-4f80-ad0e-e888ebc0b869', {
          logger: logger
        })

        ldClient.once('ready', () => {
          logger.debug('LaunchDarkly is ready')
          resolve(ldClient)
        })
      })
    }
    return promise
  }

  return {
    tripped: async () => {
      return new Promise(async (resolve) => {
        const client = await getClient()
        client.variation('killswitch', { key: 'test' }, false, function(err, result) {
          logger.debug(`KillSwitch tripped: ${result}`)
          resolve(result)
        })
      })
    }
  }
}
