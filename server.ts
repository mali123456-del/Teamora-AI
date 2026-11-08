import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './server/geminiHandler.ts';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// API routes handled by server-side geminiHandler
app.use('/api', async (req, res, next) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) next();
});

// Serve Vite build output in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`TEAMORA AI server running on port ${port}`);
});
