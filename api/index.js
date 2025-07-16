// api/index.js
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js');

const app = express();
app.use(express.json());

// 📌 Login to Roblox on startup
(async () => {
  try {
    await noblox.setCookie(process.env.ROBLOSECURITY);
    const currentUser = await noblox.getCurrentUser();
    console.log(`✅ Logged into Roblox as ${currentUser.UserName}`);
  } catch (err) {
    console.error('❌ Roblox login failed:', err);
  }
})();

// 📍 Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Main POST endpoint for changing ranks
app.post('/api/rank', async (req, res) => {
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { groupId, userId, rankId } = req.body;
  if (!groupId || !userId || typeof rankId !== 'number') {
    return res.status(400).json({ error: 'Missing groupId, userId, or rankId' });
  }

  try {
    const currentRank = await noblox.getRankInGroup(groupId, userId);
    if (currentRank < rankId) {
      await noblox.promote(groupId, userId);
    } else if (currentRank > rankId) {
      await noblox.demote(groupId, userId);
    }
    const newRank = await noblox.getRankInGroup(groupId, userId);
    return res.json({ success: true, newRank });
  } catch (err) {
    console.error('❌ Rank change error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = app;
