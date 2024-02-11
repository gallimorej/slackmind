const { contextBridge } = require('electron');
const { WebClient } = require('@slack/web-api');

contextBridge.exposeInMainWorld(
  'myAPI', // the name of the global variable that will be available in the renderer
  {
    loadChannels: () => {
      console.log('loading channels');
      
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
            optionItem.value = channel.id;
            optionItem.textContent = `${channel.name} (${channel.id})`;
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
    },

    submitScheduledMessage: () => {
      // Get the submit button
      const submitButton = document.getElementById('submit');
    
      // Add an event listener to the submit button
      submitButton.addEventListener('click', function(event) {
        // Prevent the form from being submitted normally
        event.preventDefault();
    
        // Get the values from the form
        const channel = document.getElementById('channel').value;
        const post = document.getElementById('post').value;
    
        // Call your script to submit the values
        // Replace this with the actual function call
        yourSubmitFunction(channel, post);
      });
    
      function yourSubmitFunction(channel, post) {
        // Your code to submit the values goes here
        console.log(`Submitting Channel: ${channel}, Post: ${post}`);

        // Create a new instance of the WebClient class with your token
        const web = new WebClient(process.env.SLACK_TOKEN);

        const twoMinutes = new Date();
        twoMinutes.setDate(twoMinutes.getDate());
        twoMinutes.setMinutes(twoMinutes.getMinutes() + 2);
        
        web.chat.scheduleMessage({
          channel: channel,
          text: post,
          //post_at: twoMinutes.getTime() / 1000
          post_at: Math.floor(twoMinutes.getTime() / 1000)
      } );
      }
        
    }
  }
  
);