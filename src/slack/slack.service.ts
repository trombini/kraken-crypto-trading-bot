// // Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
// const  = require("@slack/web-api");

import { WebClient, LogLevel } from '@slack/web-api'
import { BotConfig } from 'src/common/config';


export const slack = (config: BotConfig) => {
  const client = new WebClient(config.slackBotToken, {
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG
  })

  const send = async () => {

    const result = await client.conversations.list();
    console.log(result)


    try {
      // Call the chat.postMessage method using the WebClient
      const result = await client.chat.postMessage({
        channel: config.slackChannel,
        text: "Hello world"
      });
      console.log(result);
    }
    catch (error) {
      console.error(error);
    }
  }

  return {
    send
  }
}



// // WebClient insantiates a client that can call API methods
// // When using Bolt, you can use either `app.client` or the `client` passed to listeners.
// const client = new WebClient("xoxb-your-token", {
//   // LogLevel can be imported and used to make debugging simpler
//   logLevel: LogLevel.DEBUG
// });
// // ID of the channel you want to send the message to
// const channelId = "C12345";

// try {
//   // Call the chat.postMessage method using the WebClient
//   const result = await client.chat.postMessage({
//     channel: channelId,
//     text: "Hello world"
//   });

//   console.log(result);
// }
// catch (error) {
//   console.error(error);
// }
