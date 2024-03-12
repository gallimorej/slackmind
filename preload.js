const { ipcRenderer, contextBridge } = require('electron');
const { WebClient } = require('@slack/web-api');

window.ipcRenderer = ipcRenderer;

contextBridge.exposeInMainWorld(
  'myAPI', // the name of the global variable that will be available in the renderer
  { 

    loadChannels: () => {
      console.log('loading channels');
      
      // Create a new instance of the WebClient class with your token
      const web = new WebClient(process.env.SLACK_TOKEN);

      
      web.conversations.list()
      .then((res) => {
        const channels = res.channels.sort((a, b) => a.name.localeCompare(b.name));

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
      
      /*
      web.chat.scheduledMessages.list()
      .then((res) => {
          const messages = res.scheduled_messages;

          // Get the ul element
          //const messageSelect = document.getElementById('message');
          // Create a new table element
          const messagesTableBody = document.getElementById('messages');

          
          // Create a new table row for each message
          messages.forEach((message) => {
            const row = document.createElement('tr');
            
            const cellChannel = document.createElement('td');
            cellChannel.textContent = message.channel_id;
            row.appendChild(cellChannel);

            const cellMessage = document.createElement('td');
            cellMessage.textContent = message.text;
            row.appendChild(cellMessage);
            
            const cellScheduledDate = document.createElement('td');
            cellScheduledDate.textContent = message.post_at;
            row.appendChild(cellScheduledDate);
            
            const cellScheduledTime = document.createElement('td');
            cellScheduledTime.textContent = message.post_at;
            row.appendChild(cellScheduledTime);

            messagesTableBody.appendChild(row);
          });

          

          // Create a new li element for each message
          //messages.forEach((message) => {
            //const optionItem = document.createElement('option');
            //optionItem.textContent = message.text;
            //messageSelect.appendChild(optionItem);
          //});
      })
      */

      return web.chat.scheduledMessages.list()
        .then((res) => {
          const messages = res.scheduled_messages;
          return messages; // Return the messages array
      });
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
        const scheduledDate = document.getElementById('scheduled_date').value;

        const scheduledHour = parseInt(document.getElementById('scheduled_hour').value, 10);
        const scheduledMinute = parseInt(document.getElementById('scheduled_minute').value, 10);
        const scheduledAMPM = document.querySelector('input[name="scheduled_ampm"]:checked').value;

        const scheduledDateTime = getScheduledDateTime(scheduledDate, scheduledHour, scheduledMinute, scheduledAMPM);
    
        // Call your script to submit the values
        // Replace this with the actual function call
        yourSubmitFunction(channel, post, scheduledDateTime);
      });

      function getScheduledDateTime(date, hour, minute, ampm) {
        // Convert the hour to 24-hour format if PM is selected
        if (ampm === 'PM' && hour < 12) {
          hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
      
        // Create a new Date object
        const scheduledDateTime = new Date(date);
        // the date that gets retuned uses a zero-based day of the month
        scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
        scheduledDateTime.setHours(hour);
        scheduledDateTime.setMinutes(minute);
      
        // Return the epoch time
        return scheduledDateTime;
      }
    
      function yourSubmitFunction(channel, post, scheduledDateTime) {
        // Your code to submit the values goes here
        console.log(`Submitting Channel: ${channel}, Post: ${post}, Scheduled Date: ${scheduledDateTime}`);

        // Create a new instance of the WebClient class with your token
        const web = new WebClient(process.env.SLACK_TOKEN);

        web.chat.scheduleMessage({
          channel: channel,
          text: post,
          // divide by 1000 to convert to seconds
          post_at: scheduledDateTime / 1000
      } );
      }
        
    }
  }
  
);