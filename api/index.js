// api/index.js
require('dotenv').config();
const express = require('express');
const noblox = require('noblox.js');

const app = express();
app.use(express.json());

// ✅ Suppress deprecation warnings
noblox.setOptions({ show_deprecation_warnings: false });

// 🔐 Authenticate to Roblox
(async () => {
  try {
    const user = await noblox.setCookie(process.env.ROBLOSECURITY);
    console.log(`✅ Logged in as ${user.name} (userId: ${user.id})`);
  } catch (err) {
    console.error('❌ Roblox login failed:', err);
  }
})();

// 🔍 Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// 🚨 Main endpoint: /api/rank
app.post('/api/rank', async (req, res) => {
  if (req.headers['x-api-key'] !== process.env.API_KEY) {
    console.warn('⚠️ Unauthorized request with invalid API key');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { groupId, userId, rankId } = req.body;
  if (!groupId || !userId || typeof rankId !== 'number') {
    console.warn('⚠️ Bad request: missing required parameter(s)', req.body);
    return res.status(400).json({ error: 'Missing groupId, userId, or rankId' });
  }

  try {
    const current = await noblox.getRankInGroup(groupId, userId);
    console.log(`🎯 Current rank of user ${userId} in group ${groupId} is ${current}`);

    let action;
    if (current < rankId) {
      await noblox.promote(groupId, userId);
      action = 'Promoted';
    } else if (current > rankId) {
      await noblox.demote(groupId, userId);
      action = 'Demoted';
    } else {
      action = 'No change needed';
    }

    const newRank = await noblox.getRankInGroup(groupId, userId);
    console.log(`✅ ${action} ${userId} from ${current} to ${newRank}`);
    return res.json({ success: true, newRank });
  } catch (err) {
    console.error('🛑 Error changing rank:', err);

    // Provide more context in the log
    console.error(`Payload → group: ${groupId}, user: ${userId}, targetRank: ${rankId}`);
    console.error('Ensure the bot account has "Manage Members" permission in the group.');  

    return res.status(500).json({ error: err.message });
  }
});

module.exports = app;
