// main.js

const { app, BrowserWindow } = require('electron')
const { WebClient } = require('@slack/web-api');

// Create a new instance of the WebClient class with your token
const web = new WebClient(process.env.SLACK_TOKEN);

// The ID of the conversation you want to send the message to
const conversationId = process.env.SLACK_CHANNEL_ID;

const twoMinutes = new Date();
twoMinutes.setDate(twoMinutes.getDate());
twoMinutes.setMinutes(twoMinutes.getMinutes() + 2);

// let tomorrow = new Date();
// tomorrow.setDate(tomorrow.getDate() + 1);
// tomorrow.setHours(9, 0, 0);

function createWindow () {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        }
    })

    win.loadFile('index.html')
}

(async () => {

    // Post a message to the channel, and await the result.
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    let result = await web.chat.scheduleMessage({
        channel: conversationId,
        text: `Looking to the future at ${twoMinutes.toLocaleTimeString()}!`,
        //post_at: twoMinutes.getTime() / 1000
        post_at: Math.floor(twoMinutes.getTime() / 1000)
    } );
    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully send scheduled message ${result} in conversation ${conversationId}`);

    result = await web.chat.scheduledMessages.list({
        channel: conversationId,
    });

    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully returned scheduled messages ${result} in conversation ${conversationId}`);
    // Print scheduled messages
    for (const message of result.scheduled_messages) {
        console.log(message);
    }
  
  })();

  /*
  (async () => {

    // Post a message to the channel, and await the result.
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    const result = await web.chat.postMessage({
      text: 'Hello world!',
      channel: conversationId,
    });
  
    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully send message ${result.ts} in conversation ${conversationId}`);
  })();
  */

app.whenReady().then(createWindow)