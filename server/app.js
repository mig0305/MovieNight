import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './middleware/logger.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import moviesRouter from './routes/movies.js';
import nightsRouter from './routes/nights.js';
import membershipsRouter from './routes/memberships.js';
import watchlistRouter from './routes/watchlist.js';

// app.js builds the Express app: middleware and routes, in order.
// It does NOT connect to the database or listen on a port; server.js does that.
const app = express();

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN ?? '').replace(/\/+$/, '');

// S21 rate limits
const apiLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  limit: 300,
  message: { error: 'Too many requests. Try again later.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true, // only failed logins count
  message: { error: 'Too many attempts. Try again later.' },
});

app.use(helmet()); // first: secure headers, removes X-Powered-By
app.set('trust proxy', 1);
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '10kb' })); // cap body size
app.use(logger);
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// public
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
// locked
app.use('/api/nights', requireAuth, nightsRouter);
app.use('/api/memberships', requireAuth, membershipsRouter);
app.use('/api/watchlist', requireAuth, watchlistRouter);
// After all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Last: anything that threw
app.use(errorHandler);

export default app;
