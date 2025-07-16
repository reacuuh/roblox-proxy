// api/index.js
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js');

const app = express();
app.use(express.json());

// 🚀 Config: suppress deprecation warnings
noblox.setOptions({ show_deprecation_warnings: false });

// 📌 Login to Roblox & fetch authenticated info
(async () => {
  try {
    const authUser = await noblox.setCookie(process.env.ROBLOSECURITY);
    console.log(`✅ Logged in as ${authUser.name} (userId: ${authUser.id})`);
  } catch (err) {
    console.error('❌ Roblox login failed:', err);
  }
})();

// 📍 Endpoints

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.post('/api/rank', async (req, res) => {
  if (req.headers['x-api-key'] !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { groupId, userId, rankId } = req.body;
  if (!groupId || !userId || typeof rankId !== 'number') {
    return res
      .status(400)
      .json({ error: 'Missing groupId, userId, or rankId' });
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
