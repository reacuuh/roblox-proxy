// api/index.js
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js');
const app = express();

app.use(express.json());

// 📌 Login to Roblox
(async () => {
  try {
    await noblox.setCookie(process.env.ROBLOSECURITY);
    const currentUser = await noblox.getCurrentUser();
    console.log(`✅ Logged into Roblox as ${currentUser.UserName}`);
  } catch (err) {
    console.error('Login failed:', err);
  }
})();

// 📍 Endpoint: POST /api/rank
app.post('/api/rank', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { groupId, userId, rankId } = req.body;
  if (!groupId || !userId || typeof rankId !== 'number') {
    return res.status(400).json({ error: 'Missing groupId, userId, or 
rankId' });
  }

  try {
    const currentRank = await noblox.getRankInGroup(groupId, userId);
    console.log(`User ${userId} current rank: ${currentRank}`);

    if (currentRank < rankId) {
      await noblox.promote(groupId, userId);
      console.log(`🔼 Promoted user ${userId}`);
    } else if (currentRank > rankId) {
      await noblox.demote(groupId, userId);
      console.log(`🔽 Demoted user ${userId}`);
    } else {
      console.log('⚖️ Rank already matches');
    }

    const newRank = await noblox.getRankInGroup(groupId, userId);
    return res.json({ success: true, newRank });
  } catch (err) {
    console.error('Error changing rank:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = app;

