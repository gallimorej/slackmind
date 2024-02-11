const { contextBridge } = require('electron');
const { WebClient } = require('@slack/web-api');

contextBridge.exposeInMainWorld(
  'myAPI', // the name of the global variable that will be available in the renderer
  {
    doSomething: () => {
      console.log('doing something new');
      
      // Create a new instance of the WebClient class with your token
      const web = new WebClient(process.env.SLACK_TOKEN);

      
      web.conversations.list()
      .then((res) => {
          const channels = res.channels;

          // Get the ul element
          const channelSelect = document.getElementById('channel');

          // Create a new li element for each channel
          channels.forEach((channel) => {
            const optionItem = document.createElement('option');
            optionItem.textContent = channel.name;
            channelSelect.appendChild(optionItem);
          });
      })
        
    },

    loadScheduledMessages: () => {
      console.log('loading messages');
      
      // Create a new instance of the WebClient class with your token
      const web = new WebClient(process.env.SLACK_TOKEN);

      web.chat.scheduledMessages.list()
      .then((res) => {
          const messages = res.scheduled_messages;

          // Get the ul element
          const messageSelect = document.getElementById('message');

          // Create a new li element for each message
          messages.forEach((message) => {
            const optionItem = document.createElement('option');
            optionItem.textContent = message.text;
            messageSelect.appendChild(optionItem);
          });
      })
    }
  }
  
);