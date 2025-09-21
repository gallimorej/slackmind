const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const web = new WebClient(process.env.SLACK_TOKEN);

async function fetchTeamInfo() {
  try {
      const result = await web.team.info();
      return result.team;
  } catch (error) {
      console.error('Error fetching team info:', error);
      throw error;
  }
}

async function fetchChannels() {
    try {
        let allChannels = [];
        let cursor = undefined;
        
        do {
            const result = await web.conversations.list({
                cursor: cursor,
                limit: 200 // Maximum allowed by Slack API
            });
            
            if (result.channels) {
                allChannels = allChannels.concat(result.channels);
            }
            
            cursor = result.response_metadata?.next_cursor;
        } while (cursor);
        
        return allChannels;
    } catch (error) {
        console.error('Error fetching channels:', error);
        throw error;
    }
}

async function fetchScheduledMessages() {
  try {
    let allMessages = [];
    let cursor = undefined;
    
    do {
      const result = await web.chat.scheduledMessages.list({
        cursor: cursor,
        limit: 200 // Maximum allowed by Slack API
      });
      
      if (result.scheduled_messages) {
        allMessages = allMessages.concat(result.scheduled_messages);
      }
      
      cursor = result.response_metadata?.next_cursor;
    } while (cursor);
    
    return allMessages;
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    throw error;
  }
}

async function createScheduledMessage(channel, message, post_at) {
  try {
    await web.chat.scheduleMessage({
      channel: channel,
      text: message,
      // blocks: JSON.stringify(block),
      post_at: post_at,
    });
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

async function fetchUsers() {
  try {
    const response = await web.users.list();
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.members;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function fetchUserImages(userID) {
  try {
    const response = await web.files.list({
      user: userID,
      types: 'images'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    return response.files;
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

module.exports = {
    fetchChannels,
    fetchTeamInfo,
    fetchScheduledMessages,
    createScheduledMessage,
    deleteScheduledMessage,
    fetchUsers,
    fetchUserImages
};