import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { logger } from './middleware/logger.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import moviesRouter from './routes/movies.js';
import nightsRouter from './routes/nights.js';
import membershipsRouter from './routes/memberships.js';

// If a value changes between environments, it's config, not code.
// Locally it comes from server/.env; in production from the host's settings page.
const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN', 'TMDB_TOKEN'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const app = express();

// Order matters: cors and json before the routes
// Origin must match exactly: drop a trailing / so "http://localhost:5173/" still works
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN.replace(/\/+$/, '');
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(logger);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// public
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
// locked
app.use('/api/nights', requireAuth, nightsRouter);
app.use('/api/memberships', requireAuth, membershipsRouter);

// After all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Last: anything that threw
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

try {
  await connectDB(process.env.MONGODB_URI);
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error('Check MONGODB_URI, and in Atlas that your IP is allowed (Network Access).');
  process.exit(1);
}
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
