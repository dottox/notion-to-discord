const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const APP_URL = process.env.APP_URL;
const DISCORD_WEBHOOK_URL_VJ = process.env.DISCORD_WEBHOOK_VJ;
const DISCORD_WEBHOOK_URL_EE = process.env.DISCORD_WEBHOOK_EE;
const DISCORD_WEBHOOK_URL_PHP = process.env.DISCORD_WEBHOOK_PHP;

app.use(express.json());

app.get('/ping', (req, res) => res.send('pong'));

app.post('/webhook', async (req, res) => {
  const data = req.body.data || {};
  const props = data.properties || {};

  // Helper to extract values based on Notion's data types
  const getVal = (prop) => {
    if (!prop) return "N/A";
    if (prop.title) return prop.title[0]?.plain_text || "Untitled";
    if (prop.rich_text) return prop.rich_text[0]?.plain_text || "None";
    if (prop.select) return prop.select.name;
    if (prop.status) return prop.status.name;
    if (prop.date) return prop.date.start;
    if (prop.created_time) return prop.created_time;
    if (prop.people) return prop.people.map(p => p.name).join(', ') || "Unassigned";
    return "N/A";
  };

  const discordPayload = {
    embeds: [{
      title: "📌 Notion Kanban Update",
      url: data.url || null, // Links directly to the Notion page
      color: 3447003, // Nice blue color
      fields: [
        { name: "Name", value: getVal(props["Name"]), inline: false },
        { name: "Assigned To", value: getVal(props["Assigned To"]), inline: true },
        { name: "Prioridad", value: getVal(props["Prioridad"]), inline: true },
        { name: "Status", value: getVal(props["Status"]), inline: true },
        { name: "Fecha creación", value: getVal(props["Fecha creación"]), inline: false }
      ],
      footer: { text: "Log Kanban" },
      timestamp: new Date()
    }]
  };

  const pageTitle = getVal(props["Name"]);
  const normalizedTitle = typeof pageTitle === 'string' ? pageTitle.toUpperCase() : '';

  let targetWebhookUrl;
  if (normalizedTitle.includes('[VJ]')) {
    targetWebhookUrl = DISCORD_WEBHOOK_URL_VJ;
  } else if (normalizedTitle.includes('[PHP]')) {
    targetWebhookUrl = DISCORD_WEBHOOK_URL_PHP;
  } else if (normalizedTitle.includes('[EE]')) {
    targetWebhookUrl = DISCORD_WEBHOOK_URL_EE;
  }

  if (!targetWebhookUrl) {
    return res.status(400).send('No matching webhook tag in title ([VJ], [PHP], [EE])');
  }

  try {
    await axios.post(targetWebhookUrl, discordPayload);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Error');
  }
});

app.listen(PORT, () => {
  console.log(`Middleware listening on port ${PORT}`);
  if (APP_URL) {
    setInterval(() => {
      axios.get(`${APP_URL}/ping`).catch(() => {});
    }, 20 * 60 * 1000);
  }
});