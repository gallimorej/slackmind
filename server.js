const express = require('express');
const path = require('path');
require('dotenv').config();
const { fetchChannels, fetchScheduledMessages, createScheduledMessage, deleteScheduledMessage, fetchTeamInfo } = require('./slackutils');
const { getPostAtEpoch } = require('./utils');
const moment = require('moment-timezone');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const defaultTimezone = config.defaultTimezone || 'GMT';

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

        let formHtml = '<!DOCTYPE html>';
        formHtml += '<html lang="en">';
        formHtml += '<head>';
        formHtml += '<meta charset="UTF-8">';
        formHtml += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        formHtml += '<link rel="icon" href="/favicon.ico" type="image/x-icon">';
        formHtml += '<title>Create Scheduled Message</title>';
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
        formHtml += '<h2>Create Scheduled Message</h2>';
        formHtml += '<form action="/create-scheduled-message" method="POST">';
        formHtml += '<label for="channel">Channel:</label>';
        formHtml += '<select name="channel" id="channel">';
        channels.forEach(channel => {
            formHtml += `<option value="${channel.id}">${channel.name}</option>`;
        });
        formHtml += '</select><br>';
        formHtml += '<label for="message">Message:</label>';
        formHtml += `<textarea id="message" name="message" rows="10" cols="50"></textarea><br>`;
        formHtml += '<label for="post_at">Post At (timestamp):</label>';
        formHtml += '<input type="datetime-local" id="post_at" name="post_at"><br>';
        formHtml += '<label for="timezone">Timezone:</label>';
        formHtml += '<select name="timezone" id="timezone">';
        timezones.forEach(timezone => {
            const selected = timezone === defaultTimezone ? 'selected' : '';
            formHtml += `<option value="${timezone}" ${selected}>${timezone}</option>`;
        });
        formHtml += '</select><br><br>';
        formHtml += '<button type="submit">Schedule Message</button>';
        formHtml += '<button type="button" onclick="window.location.href=\'/\'">Cancel</button>'; // Add cancel button
        formHtml += '</form>';
        formHtml += '</body>';
        formHtml += '</html>';

        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        if (!res.headersSent) {
        res.status(500).send('Error rendering form');
        }
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

app.get('/edit-scheduled-message', async (req, res) => {
    try {
        const { channel_id, message_id } = req.query;
        const messages = await fetchScheduledMessages();

        const selectedMessage = messages.find(message => message.id === message_id);

        if (!selectedMessage) {
            return res.status(404).send('Message not found');
        }

        const team = await fetchTeamInfo();
        const channels = await fetchChannels();
        const timezones = moment.tz.names();

        let formHtml = '<!DOCTYPE html>';
        formHtml += '<html lang="en">';
        formHtml += '<head>';
        formHtml += '<meta charset="UTF-8">';
        formHtml += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        formHtml += '<link rel="icon" href="/favicon.ico" type="image/x-icon">';
        formHtml += '<title>Edit Scheduled Message</title>';
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
        formHtml += '<h2>Edit Scheduled Message</h2>';
        
        formHtml += '<form action="/edit-scheduled-message" method="POST">';
        formHtml += `<input type="hidden" name="old_channel_id" value="${channel_id}">`;
        formHtml += `<input type="hidden" name="old_message_id" value="${message_id}">`;
        formHtml += '<label for="channel">Channel:</label>';
        formHtml += '<select name="channel" id="channel">';
        channels.forEach(channel => {
            const selected = channel.id === selectedMessage.channel_id ? 'selected' : '';
            formHtml += `<option value="${channel.id}" ${selected}>${channel.name}</option>`;
        });
        formHtml += '</select><br>';
        formHtml += '<label for="message">Message:</label>';
        // formHtml += `<input type="text" id="message" name="message" value="${selectedMessage.text}"><br>`;
        formHtml += `<textarea id="message" name="message" rows="10" cols="50">${selectedMessage.text}</textarea><br>`;
        formHtml += '<label for="post_at">Post At (timestamp):</label>';
        //TODO adjust the date and time to the timezone
        formHtml += `<input type="datetime-local" id="post_at" name="post_at" value="${moment.unix(selectedMessage.post_at).tz(defaultTimezone).format('YYYY-MM-DDTHH:mm')}"><br>`;
        formHtml += '<label for="timezone">Timezone:</label>';
        formHtml += '<select name="timezone" id="timezone">';
        timezones.forEach(timezone => {
            const selected = timezone === defaultTimezone ? 'selected' : '';
            formHtml += `<option value="${timezone}" ${selected}>${timezone}</option>`;
        });
        formHtml += '</select><br><br>';
        formHtml += '<button type="submit">Schedule Message</button>';
        formHtml += '<button type="button" onclick="window.location.href=\'/\'">Cancel</button>'; // Add cancel button
        formHtml += '</form>';

        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        if (!res.headersSent) {
        res.status(500).send('Error rendering form');
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

app.get('/copy-scheduled-message', async (req, res) => {
    try {
        const { channel_id, message_id } = req.query;
        const messages = await fetchScheduledMessages();

        const selectedMessage = messages.find(message => message.id === message_id);

        if (!selectedMessage) {
            return res.status(404).send('Message not found');
        }

        const team = await fetchTeamInfo();
        const channels = await fetchChannels();
        const timezones = moment.tz.names();

        let formHtml = '<!DOCTYPE html>';
        formHtml += '<html lang="en">';
        formHtml += '<head>';
        formHtml += '<meta charset="UTF-8">';
        formHtml += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        formHtml += '<link rel="icon" href="/favicon.ico" type="image/x-icon">';
        formHtml += '<title>Copy Scheduled Message</title>';
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
        formHtml += '<h2>Copy Scheduled Message</h2>';
        
        formHtml += '<form action="/copy-scheduled-message" method="POST">';
        formHtml += '<label for="channel">Channel:</label>';
        formHtml += '<select name="channel" id="channel">';
        channels.forEach(channel => {
            const selected = channel.id === selectedMessage.channel_id ? 'selected' : '';
            formHtml += `<option value="${channel.id}" ${selected}>${channel.name}</option>`;
        });
        formHtml += '</select><br>';
        formHtml += '<label for="message">Message:</label>';
        // formHtml += `<input type="text" id="message" name="message" value="${selectedMessage.text}"><br>`;
        formHtml += `<textarea id="message" name="message" rows="10" cols="50">${selectedMessage.text}</textarea><br>`;
        formHtml += '<label for="post_at">Post At (timestamp):</label>';
        //TODO adjust the date and time to the timezone
        formHtml += `<input type="datetime-local" id="post_at" name="post_at" value="${moment.unix(selectedMessage.post_at).tz(defaultTimezone).format('YYYY-MM-DDTHH:mm')}"><br>`;
        formHtml += '<label for="timezone">Timezone:</label>';
        formHtml += '<select name="timezone" id="timezone">';
        timezones.forEach(timezone => {
            const selected = timezone === defaultTimezone ? 'selected' : '';
            formHtml += `<option value="${timezone}" ${selected}>${timezone}</option>`;
        });
        formHtml += '</select><br><br>';
        formHtml += '<button type="submit">Schedule Message</button>';
        formHtml += '<button type="button" onclick="window.location.href=\'/\'">Cancel</button>'; // Add cancel button
        formHtml += '</form>';

        res.send(formHtml);
    } catch (error) {
        console.error('Error rendering form:', error);
        if (!res.headersSent) {
        res.status(500).send('Error rendering form');
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});