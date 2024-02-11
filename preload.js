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
        
    }
  }
);