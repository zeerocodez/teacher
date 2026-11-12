import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import app, { ensureDb, runAutomatedEscrowReleaseCron } from './server/server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    await ensureDb();
  } catch (err) {
    console.error("Database initialization notice on startup:", err.message);
  }

  // Automated escrow release worker
  runAutomatedEscrowReleaseCron().catch(e => console.error("[ESCROW CRON] Initial run error:", e));
  setInterval(() => {
    runAutomatedEscrowReleaseCron().catch(e => console.error("[ESCROW CRON] Recurring run error:", e));
  }, 10 * 60 * 1000);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: HOST, port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`EduVista Africa running at http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
