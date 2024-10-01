const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const { fetchChannels, fetchScheduledMessages, createScheduledMessage, deleteScheduledMessage, fetchTeamInfo, fetchUsers, fetchUserImages, fetchImageByUrl } = require('./slackutils');
const { getPostAtEpoch } = require('./utils');
const moment = require('moment-timezone');
// const fetch = require('node-fetch'); // Add this line to import node-fetch
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const defaultTimezone = config.defaultTimezone || 'GMT';

function generateFormHtml(team, channels, timezones, formAction, formTitle, message = {}) {
    let formHtml = '<!DOCTYPE html>';
    formHtml += '<html lang="en">';
    formHtml += '<head>';
    formHtml += '<meta charset="UTF-8">';
    formHtml += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    formHtml += '<link rel="icon" href="/favicon.ico" type="image/x-icon">';
    formHtml += `<title>${formTitle}</title>`;
    formHtml += '<style>';
    formHtml += '#workspace-info { display: flex; align-items: center; }';
    formHtml += '#workspace-icon { margin-right: 10px; width: 68px; height: 68px; }';
    formHtml += 'button { background-color: #4CAF50; border: none; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px; }';
    formHtml += '</style>';
    formHtml += '</head>';
    formHtml += '<body>';
    formHtml += '<div id="workspace-info">';
    formHtml += `<img id="workspace-icon" src="${team.icon.image_68}" alt="Workspace Icon" style="display: inline;">`;
    formHtml += `<h1 id="workspace-name">${team.name}</h1>`;
    formHtml += '</div>';
    formHtml += `<h2>${formTitle}</h2>`;
    formHtml += `<form action="${formAction}" method="POST">`;
    formHtml += `<input type="hidden" name="old_channel_id" value="${message.channel_id}">`;
    formHtml += `<input type="hidden" name="old_message_id" value="${message.id}">`;
    formHtml += '<label for="channel">Channel:</label>';
    formHtml += '<select name="channel" id="channel">';
    channels.forEach(channel => {
        const selected = message.channel_id === channel.id ? 'selected' : '';
        formHtml += `<option value="${channel.id}" ${selected}>${channel.name}</option>`;
    });
    formHtml += '</select><br>';
    formHtml += '<label for="message">Message:</label>';
    formHtml += `<textarea id="message" name="message" rows="10" cols="50">${message.text || ''}</textarea><br>`;
    formHtml += '<label for="post_at">Post At (timestamp):</label>';
    formHtml += `<input type="datetime-local" id="post_at" name="post_at"`;
    if (message) {
        const postAtValue = moment.unix(message.post_at).tz(defaultTimezone).format('YYYY-MM-DDTHH:mm');
        formHtml += ` value="${postAtValue}"`;
    }
    
    formHtml += `><br>`;
    formHtml += '<label for="timezone">Timezone:</label>';
    formHtml += '<select name="timezone" id="timezone">';
    timezones.forEach(timezone => {
        const selected = timezone === defaultTimezone ? 'selected' : '';
        formHtml += `<option value="${timezone}" ${selected}>${timezone}</option>`;
    });
    formHtml += '</select><br><br>';
    formHtml += '<button type="submit">Submit</button>';
    formHtml += '<button type="button" onclick="window.location.href=\'/\'">Cancel</button>';
    formHtml += '</form>';
    formHtml += '</body>';
    formHtml += '</html>';
    return formHtml;
}

app.use(express.urlencoded({ extended: true })); // Middleware to parse form data

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve config.json
app.get('/config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'config.json'));
});

// Define the /channels endpoint
app.get('/channels', async (req, res) => {
    try {
        const channels = await fetchChannels();
        res.json(channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// Define the /team-info endpoint
app.get('/team-info', async (req, res) => {
    try {
        const team = await fetchTeamInfo();
        res.json(team);
    } catch (error) {
        console.error('Error fetching team info:', error);
        res.status(500).json({ error: 'Failed to fetch team info' });
    }
});


app.get('/scheduled-messages', async (req, res) => {
    try {
        const messages = await fetchScheduledMessages(); // Implement this function to fetch messages
        res.json(messages);
    } catch (error) {
        console.error('Error fetching scheduled messages:', error);
        res.status(500).send('Error fetching scheduled messages');
    }
});

app.delete('/scheduled-messages/:channel_id/:message_id', async (req, res) => {
    const { channel_id, message_id } = req.params;
    try {
        await deleteScheduledMessage(channel_id, message_id); // Pass both channel_id and message_id
        res.status(200).send('Message deleted');
    } catch (error) {
        console.error('Error deleting scheduled message:', error);
        res.status(500).send('Error deleting scheduled message');
    }
});

app.get('/create-scheduled-message', async (req, res) => {
    try {
        const team = await fetchTeamInfo();
        const channels = await fetchChannels();
        const timezones = moment.tz.names();
        const formHtml = generateFormHtml(team, channels, timezones, '/create-scheduled-message', 'Create Scheduled Message');
        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        res.status(500).send('Error rendering form');
    }
});

app.get('/edit-scheduled-message', async (req, res) => {
    try {
        const { channel_id, message_id } = req.query;
        const team = await fetchTeamInfo();
        const channels = await fetchChannels();
        const timezones = moment.tz.names();
        const messages = await fetchScheduledMessages();
        const selectedMessage = messages.find(message => message.id === message_id);

        if (!selectedMessage) {
            return res.status(404).send('Message not found');
        }

        //const formHtml = generateFormHtml(team, channels, timezones, `/edit-scheduled-message?channel_id=${channel_id}&id=${message_id}`, 'Edit Scheduled Message', selectedMessage);
        const formHtml = generateFormHtml(team, channels, timezones, `/edit-scheduled-message`, 'Edit Scheduled Message', selectedMessage);
        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        res.status(500).send('Error rendering form');
    }
});

app.get('/copy-scheduled-message', async (req, res) => {
    try {
        const { channel_id, message_id } = req.query;
        const team = await fetchTeamInfo();
        const channels = await fetchChannels();
        const timezones = moment.tz.names();
        const messages = await fetchScheduledMessages();
        const selectedMessage = messages.find(message => message.id === message_id);

        if (!selectedMessage) {
            return res.status(404).send('Message not found');
        }
    
        const formHtml = generateFormHtml(team, channels, timezones, '/create-scheduled-message', 'Copy Scheduled Message', selectedMessage);
        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        res.status(500).send('Error rendering form');
    }
});

app.post('/create-scheduled-message', async (req, res) => {
    const { channel, message, post_at, timezone } = req.body;
    const localDateTime = moment.tz(post_at, timezone);
    const scheduledDateTime = localDateTime.unix(); // Convert to epoch time in seconds
    try {
        await createScheduledMessage(channel, message, scheduledDateTime);
        res.redirect('/');
    } catch (error) {
        console.error('Error creating scheduled message:', error);
        if (!res.headersSent) {
        res.status(500).send('Error creating scheduled message');
        }
    }
});

app.post('/edit-scheduled-message', async (req, res) => {
    const { old_channel_id, old_message_id, channel, message, post_at, timezone } = req.body;
    const localDateTime = moment.tz(post_at, timezone);
    const scheduledDateTime = localDateTime.unix(); // Convert to epoch time in seconds
    try {
        await createScheduledMessage(channel, message, scheduledDateTime);
        await deleteScheduledMessage(old_channel_id, old_message_id);
        res.redirect('/');
    } catch (error) {
        console.error('Error editing scheduled message:', error);
        if (!res.headersSent) {
            res.status(500).send('Error editing scheduled message');
        }
    }
});

app.post('/copy-scheduled-message', async (req, res) => {
    const { channel, message, post_at, timezone } = req.body;
    const localDateTime = moment.tz(post_at, timezone);
    const scheduledDateTime = localDateTime.unix(); // Convert to epoch time in seconds
    try {
        await createScheduledMessage(channel, message, scheduledDateTime);
        res.redirect('/');
    } catch (error) {
        console.error('Error copying scheduled message:', error);
        if (!res.headersSent) {
            res.status(500).send('Error copying scheduled message');
        }
    }
});

// Serve the HTML page
app.get('/images', async (req, res) => {
    try {
        // const users = await fetchUsers();
        const users = config.imageUsers;

        let userOptions = '';
        users.forEach(user => {
            userOptions += `<option value="${user.id}">${user.name}</option>`;
        });

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Retrieve Images</title>
            </head>
            <body>
                <h1>Retrieve Images from Slack</h1>
                <form action="/images" method="POST">
                    <label for="user">Select User:</label>
                    <select name="user" id="user">
                        ${userOptions}
                    </select>
                    <button type="submit">Retrieve Images</button>
                </form>
                <div id="images"></div>
            </body>
            </html>
        `;
        res.send(html);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Handle image retrieval
app.post('/images', async (req, res) => {
    const userId = req.body.user;
    try {
      const files = await fetchUserImages(userId);
  
      let imagesHtml = '<h2>Retrieved Images</h2><table>';
      files.forEach(file => {
        imagesHtml += `
          <tr>
            <td>
              <a href="${file.permalink}" target="_blank">
                <img src="/proxy-image?url=${encodeURIComponent(file.thumb_360)}" alt="${file.title}">
              </a>
            </td>
            <td>
              <a href="${file.permalink}" target="_blank">${file.title}</a>
            </td>
          </tr>
        `;
      });
      imagesHtml += '</table>';
  
      const users = config.imageUsers;
      let userOptions = '';
      users.forEach(user => {
        userOptions += `<option value="${user.id}">${user.name}</option>`;
      });
  
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Retrieved Images</title>
        </head>
        <body>
            <h1>Retrieve Images from Slack</h1>
            <form action="/images" method="POST">
                <label for="user">Select User:</label>
                <select name="user" id="user">
                    ${userOptions}
                </select>
                <button type="submit">Retrieve Images</button>
            </form>
          <div id="images">
            ${imagesHtml}
          </div>
        </body>
        </html>
      `;
      res.send(html);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).send('Error fetching images');
    }
});

// New route to proxy images
app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    try {
        // Dynamically import node-fetch
        const fetch = (await import('node-fetch')).default;

        const response = await fetch(imageUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.SLACK_TOKEN}` // Use your Slack token if needed
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer

        res.set('Content-Type', response.headers.get('content-type')); // Set the Content-Type header dynamically
        res.send(buffer);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Error fetching image');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});