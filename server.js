const express = require('express');
const path = require('path');
require('dotenv').config();
const { fetchChannels, fetchScheduledMessages, createScheduledMessage } = require('./slackutils');
const { getPostAtEpoch } = require('./utils');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // Middleware to parse form data

app.get('/', async (req, res) => {
    try {
        const channels = await fetchChannels();
        const scheduledMessages = await fetchScheduledMessages();

        // Render the channels and scheduled messages as a list in the response
        let responseHtml = '<h1>Slack Channels</h1><ul>';
        channels.forEach(channel => {
        responseHtml += `<li>${channel.name} (ID: ${channel.id})</li>`;
        });
        responseHtml += '</ul>';

        responseHtml += '<h1>Scheduled Messages</h1><ul>';
        scheduledMessages.forEach(message => {
            // All of the Slack messages are stored in UTC time
            const timezone = message.timezone || 'GMT'; // Default to GMT if timezone is not defined
            if (message.post_at) {
                const postAt = moment.unix(message.post_at).tz(timezone).format('YYYY-MM-DD HH:mm:ss z');
                responseHtml += `<li>Message ID: ${message.id}, Channel ID: ${message.channel}, Post At: ${postAt}</li>`;
            } else {
                responseHtml += `<li>Message ID: ${message.id}, Channel ID: ${message.channel}, Post At: Invalid date/time</li>`;
            }
        });
        responseHtml += '</ul>';

        responseHtml += '<a href="/create-scheduled-message">Create Scheduled Message</a>';

        res.send(responseHtml);
    } catch (error) {
        console.error('Error fetching data:', error);
        if (!res.headersSent) {
        res.status(500).send('Error fetching data');
        }
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
        formHtml += '<input type="text" id="message" name="message"><br>';
        formHtml += '<label for="post_at">Post At (timestamp):</label>';
        formHtml += '<input type="datetime-local" id="post_at" name="post_at"><br>';
        formHtml += '<label for="timezone">Timezone:</label>';
        formHtml += '<select name="timezone" id="timezone">';
        timezones.forEach(timezone => {
        formHtml += `<option value="${timezone}">${timezone}</option>`;
        });
        formHtml += '</select><br>';
        formHtml += '<button type="submit">Schedule Message</button>';
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});