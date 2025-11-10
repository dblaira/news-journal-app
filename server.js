// Simple local dev server to expose the serverless API in `api/`
// Usage: set ANTHROPIC_API_KEY in .env or your environment, then `node server.js`
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.resolve();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the project root
app.use(express.static(__dirname));

// Proxy serverless api routes in ./api
app.all('/api/:file', async (req, res) => {
  const file = req.params.file;
  try {
    const mod = await import(`./api/${file}.js`);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      return res.status(500).json({ error: 'API handler not found' });
    }
    // Call the serverless-style handler
    return handler(req, res);
  } catch (err) {
    console.error('Error loading API handler:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
  console.log('Make sure ANTHROPIC_API_KEY is set in your environment or .env');
});
