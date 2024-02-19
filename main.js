// main.js
const path = require('path');
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
            preload: path.join(__dirname, 'preload.js'), // path to your preload script
            contextIsolation: true, // recommended for security reasons
        }
    })

    win.loadFile('index.html')
}

function getScheduledDateTime(date, hour, minute, ampm) {
  // Convert the hour to 24-hour format if PM is selected
  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }

  // Create a new Date object
  const scheduledDate = new Date(date);
  scheduledDate.setHours(hour);
  scheduledDate.setMinutes(minute);

  // Return the epoch time
  return scheduledDate.getTime();
}

/*
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
  */

  /*
(async () => {

    web.conversations.list()
    .then((res) => {
        const channels = res.channels;

        // Get the ul element
        const ul = document.getElementById('channel-list');

        // Create a new li element for each channel
        channels.forEach((channel) => {
        const li = document.createElement('li');
        li.textContent = channel.name;
        ul.appendChild(li);
        });
    })
    //.catch(console.error);
})();
*/

// You probably want to use a database to store any conversations information ;)
let conversationsStore = {};

async function populateConversationStore() {
  try {
    // Call the conversations.list method using the WebClient
    const result = await web.conversations.list();

    saveConversations(result.channels);
  }
  catch (error) {
    console.error(error);
  }
}

// Put conversations into the JavaScript object
function saveConversations(conversationsArray) {
    let conversationId = '';
  
    conversationsArray.forEach(function(conversation){
        // Key conversation info on its unique ID
        conversationId = conversation["id"];
    
        // Store the entire conversation object (you may not need all of the info)
        conversationsStore[conversationId] = conversation;
    });
    //console.log(conversationsStore);
}

populateConversationStore();

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