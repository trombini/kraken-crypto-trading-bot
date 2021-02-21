import { WebClient, LogLevel } from '@slack/web-api'
import { BotConfig } from '../common/config'

export const slack = (config: BotConfig) => {
  const client = new WebClient(config.slackBotToken, {
    // LogLevel can be imported and used to make debugging simpler
    //logLevel: LogLevel.DEBUG
  })

  const send = async (message: string) => {
    // return client.chat.postMessage({
    //   channel: config.slackChannel,
    //   text: message
    // }).then(result => {
      
    // }).catch(err => {
    //   console.log(err)
    // })
  }

  return {
    send
  }
}
