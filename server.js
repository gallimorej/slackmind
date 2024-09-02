const express = require('express');
const path = require('path');
require('dotenv').config();
const { fetchChannels } = require('./slackutils');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const channels = await fetchChannels();

    // Render the channels as a list in the response
    let responseHtml = '<h1>Slack Channels</h1><ul>';
    channels.forEach(channel => {
      responseHtml += `<li>${channel.name} (ID: ${channel.id})</li>`;
    });
    responseHtml += '</ul>';

    res.send(responseHtml);
  } catch (error) {
    console.error('Error fetching channels:', error);
    if (!res.headersSent) {
      res.status(500).send('Error fetching channels');
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});