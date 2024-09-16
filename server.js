const express = require('express');
const path = require('path');
require('dotenv').config();
const { fetchChannels, fetchScheduledMessages, createScheduledMessage, deleteScheduledMessage } = require('./slackutils');
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
        const channels = await fetchChannels();
        const timezones = moment.tz.names();

        let formHtml = '<h1>Create Scheduled Message</h1>';
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

        const channels = await fetchChannels();
        const timezones = moment.tz.names();

        let formHtml = '<h1>Edit Scheduled Message</h1>';
        
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

        const channels = await fetchChannels();
        const timezones = moment.tz.names();

        let formHtml = '<h1>Copy Scheduled Message</h1>';
        
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