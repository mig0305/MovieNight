import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { logger } from './middleware/logger.js';

const app = express();

// Order matters: cors and json before the routes
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.use(logger);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// After all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT ?? 3000;

await connectDB(process.env.MONGODB_URI);
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
