const fs = require('fs');

let content = fs.readFileSync('server/server.js', 'utf8');

// 1. Remove app.get('/api/debug/db')
const debugDbRegex = /app\.get\('\/api\/debug\/db', async \(req, res\) => \{[\s\S]*?\}\);/m;
content = content.replace(debugDbRegex, '');

// 2. Secure GET /api/academy/forum
content = content.replace(
  "app.get('/api/academy/forum', async (req, res) => {",
  "app.get('/api/academy/forum', authenticateToken, async (req, res) => {"
);

// 3. Secure POST /api/support/message
content = content.replace(
  "app.post('/api/support/message', supportRateLimiter, async (req, res) => {",
  "app.post('/api/support/message', authenticateToken, supportRateLimiter, async (req, res) => {"
);

fs.writeFileSync('server/server.js', content, 'utf8');
console.log('Secured endpoints successfully.');
