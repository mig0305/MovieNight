import express from 'express';
import { WatchlistItem } from '../models/WatchlistItem.js';
import { getMovie } from '../services/tmdb.js';
import {
  validate,
  WatchlistInput,
  WatchlistUpdateInput,
} from '../middleware/validate.js';

// Every route here runs after requireAuth (see app.js), so req.userId is set.
// Each user only ever sees and changes their own items.
const watchlistRouter = express.Router();

// The film id in the URL must be a positive whole number
function readTmdbId(req) {
  const tmdbId = Number(req.params.tmdbId);
  return Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;
}

const notFound = (res) =>
  res.status(404).json({ error: 'This movie is not in your watchlist' });

// GET /api/watchlist: my saved movies, newest first
watchlistRouter.get('/', async (req, res) => {
  const items = await WatchlistItem.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/watchlist { tmdbId }: save a movie; details come from TMDB
watchlistRouter.post('/', validate(WatchlistInput), async (req, res) => {
  const { tmdbId } = req.body;

  if (await WatchlistItem.exists({ user: req.userId, tmdbId })) {
    return res.status(409).json({ error: 'This movie is already in your watchlist' });
  }

  const movie = await getMovie(tmdbId); // 404 if TMDB doesn't know the film

  const item = await WatchlistItem.create({
    user: req.userId, // the owner comes from the token, never the body
    tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    runtime: movie.runtime,
    voteAverage: movie.voteAverage,
  });
  res.status(201).json(item);
});

// PATCH /api/watchlist/:tmdbId { watched }: mark as watched or not watched
watchlistRouter.patch('/:tmdbId', validate(WatchlistUpdateInput), async (req, res) => {
  const tmdbId = readTmdbId(req);
  if (!tmdbId) return notFound(res);

  const { watched } = req.body;
  const item = await WatchlistItem.findOneAndUpdate(
    { user: req.userId, tmdbId },
    { watched, watchedAt: watched ? new Date() : null },
    { returnDocument: 'after' }
  );
  if (!item) return notFound(res);
  res.json(item);
});

// DELETE /api/watchlist/:tmdbId: remove it from my watchlist
watchlistRouter.delete('/:tmdbId', async (req, res) => {
  const tmdbId = readTmdbId(req);
  if (!tmdbId) return notFound(res);

  const deleted = await WatchlistItem.findOneAndDelete({ user: req.userId, tmdbId });
  if (!deleted) return notFound(res);
  res.status(204).end();
});

export default watchlistRouter;