import { WebClient } from '@slack/web-api'
import { BotConfig } from '../common/config'
import { logger } from '../common/logger'

export const slack = (config: BotConfig) => {
  const client = new WebClient(config.slackBotToken, {
    // LogLevel can be imported and used to make debugging simpler
    //logLevel: LogLevel.DEBUG
  })

  const send = async (message: string) => {
    if(config.slackBotToken.length > 0) {
      return client.chat.postMessage({
        channel: config.slackChannel,
        text: message
      }).catch(err => {
        logger.error(err)
      })
    }
  }

  return {
    send
  }
}
