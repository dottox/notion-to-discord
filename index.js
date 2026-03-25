const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// The URL of your app (e.g., https://your-app-name.herokuapp.com)
// You should set this in Heroku Config Vars
const APP_URL = process.env.APP_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(express.json());

// 1. Keep-alive endpoint
app.get('/ping', (req, res) => {
  res.send('pong');
});

// 2. Notion Webhook Catch
app.post('/webhook', async (req, res) => {
  const notionData = req.body;

  // Format your message for Discord here
  const discordPayload = {
    embeds: [{
      title: "Notion Update Detected",
      description: `A change occurred in your Notion database.`,
      color: 5814783, // Notion-ish Blue/Gray
      fields: [
        { name: "Event Type", value: notionData.type || "Unknown", inline: true },
        { name: "Source", value: "Notion Webhook", inline: true }
      ],
      timestamp: new Date()
    }]
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
    console.log('Successfully forwarded to Discord');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error forwarding to Discord:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Middleware listening on port ${PORT}`);

  // 3. Keep-alive loop: Curl itself every 20 minutes
  if (APP_URL) {
    setInterval(() => {
      axios.get(`${APP_URL}/ping`)
        .then(() => console.log('Self-ping successful'))
        .catch(err => console.error('Self-ping failed', err.message));
    }, 20 * 60 * 1000); // 20 minutes
  }
});