import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import moviesRouter from './routes/movies.js';
import nightsRouter from './routes/nights.js';
import membershipsRouter from './routes/memberships.js';

// app.js builds the Express app: middleware and routes, in order.
// It does NOT connect to the database or listen on a port; server.js does that.
const app = express();

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN ?? '').replace(/\/+$/, '');
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

export default app;
