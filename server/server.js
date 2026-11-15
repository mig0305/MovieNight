import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import app from './app.js';

// server.js starts the app: check config, connect to MongoDB, then listen.
// The app itself (middleware + routes) lives in app.js.

// S21 injection: neutralises {"$ne": ...} in filters
mongoose.set('sanitizeFilter', true);

// S21 "Missing secret? Crash at startup"
// If a value changes between environments, it's config, not code.
// Locally it comes from server/.env; in production from the host's settings page.
const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN', 'TMDB_TOKEN'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;

// Connect first, then listen
try {
  await connectDB(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Listening on port ${port}`));
} catch (err) {
  console.error(`DB connection failed: ${err.message}`);
  console.error('Check MONGODB_URI, and in Atlas that your IP is allowed (Network Access).');
  process.exit(1);
}
