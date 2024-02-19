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
        const scheduledDate = document.getElementById('scheduled_date').value;

        const scheduledHour = parseInt(document.getElementById('scheduled_hour').value, 10);
        const scheduledMinute = parseInt(document.getElementById('scheduled_minute').value, 10);
        const scheduledAMPM = document.querySelector('input[name="scheduled_ampm"]:checked').value;

        const scheduledDateTime = getScheduledDateTime(scheduledDate, scheduledHour, scheduledMinute, scheduledAMPM);
        console.log(`Scheduled Date: ${scheduledDateTime}`);
    
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
        console.log(`Scheduled Date: ${scheduledDateTime}`);
        scheduledDateTime.setHours(hour);
        console.log(`Scheduled Date: ${scheduledDateTime}`);
        scheduledDateTime.setMinutes(minute);
        console.log(`Scheduled Date: ${scheduledDateTime}`);
      
        // Return the epoch time
        return scheduledDateTime;
      }
    
      function yourSubmitFunction(channel, post, scheduledDateTime) {
        // Your code to submit the values goes here
        console.log(`Submitting Channel: ${channel}, Post: ${post}, Scheduled Date: ${scheduledDateTime}`);

        // Create a new instance of the WebClient class with your token
        const web = new WebClient(process.env.SLACK_TOKEN);

        //const twoMinutes = new Date();
        //twoMinutes.setDate(twoMinutes.getDate());
        //twoMinutes.setMinutes(twoMinutes.getMinutes() + 2);

        console.log(`Scheduled Date: ${scheduledDateTime}`);
        console.log(`Scheduled Date: ${scheduledDateTime.getTime()}`);

        web.chat.scheduleMessage({
          channel: channel,
          text: post,
          //post_at: twoMinutes.getTime() / 1000
          //post_at: Math.floor(twoMinutes.getTime() / 1000)
          post_at: scheduledDateTime / 1000
      } );
      }
        
    }
  }
  
);