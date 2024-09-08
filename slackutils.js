const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const web = new WebClient(process.env.SLACK_TOKEN);

async function fetchChannels() {
    try {
        const result = await web.conversations.list();
        return result.channels;
    } catch (error) {
        console.error('Error fetching channels:', error);
        throw error;
    }
}

async function fetchChannelsAsMap() {
    try {
        const channels = await fetchChannels();
        const channelMap = {};
        channels.forEach(channel => {
            channelMap[channel.id] = channel.name;
        });
        return channelMap;
    } catch (error) {
        console.error('Error fetching channels as map:', error);
        throw error;
    }
  }

async function fetchScheduledMessages() {
  try {
    const res = await web.chat.scheduledMessages.list();
    return res.scheduled_messages; // Return the messages array
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    throw error;
  }
}

async function createScheduledMessage(channel, text, post_at) {
  try {
    await web.chat.scheduleMessage({
      channel: channel,
      text: text,
      post_at: post_at
    });
    console.log(`Scheduled message "${text}" for channel ${channel} at ${post_at}`);
  } catch (error) {
    console.error('Error scheduling message:', error);
    throw error;
  }
}

async function deleteScheduledMessage(channel_id, message_id) {
  try {
    await web.chat.deleteScheduledMessage({
      channel: channel_id,
      scheduled_message_id: message_id
    });
  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    throw error;
  }
}

function saveScheduledMessage() {
  // Get the submit button
  const saveButton = document.getElementById('save');

  // Add an event listener to the submit button
  saveButton.addEventListener('click', async function(event) {
    // Prevent the form from being submitted normally
    event.preventDefault();

    // Get the values from the form
    const channel = document.getElementById('channel').value;
    const post = document.getElementById('post').value;
    const scheduledDate = document.getElementById('scheduled_date').value;

    const scheduledHour = parseInt(document.getElementById('scheduled_hour').value, 10);
    const scheduledMinute = parseInt(document.getElementById('scheduled_minute').value, 10);
    const scheduledAMPM = document.querySelector('input[name="scheduled_ampm"]:checked').value;

    const scheduledDateTime = getPostAtEpoch(scheduledDate, scheduledHour, scheduledMinute, scheduledAMPM);

    console.log(`Submitting Channel: ${channel}, Post: ${post}, Scheduled Date: ${scheduledDateTime}`);

    try {
      await web.chat.scheduleMessage({
        channel: channel,
        text: post,
        // divide by 1000 to convert to seconds
        post_at: scheduledDateTime / 1000
      });
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  });
}

module.exports = {
    fetchChannels,
    // fetchChannelsAsMap,
    fetchScheduledMessages,
    createScheduledMessage,
    deleteScheduledMessage
};