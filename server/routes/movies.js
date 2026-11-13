import express from 'express';
import { searchMovies, getMovie } from '../services/tmdb.js';

const moviesRouter = express.Router();

// GET /api/movies/search?query=inception&page=1
moviesRouter.get('/search', async (req, res) => {
  const { query = '', page = '1' } = req.query;
  if (typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'query is required' });
  }
  const pageNumber = Number(page); // everything in the URL is a string
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ error: 'page must be a number from 1' });
  }
  res.json(await searchMovies(query.trim(), pageNumber));
});

// GET /api/movies/27205
moviesRouter.get('/:tmdbId', async (req, res) => {
  const tmdbId = Number(req.params.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    return res.status(400).json({ error: 'tmdbId must be a number' });
  }
  res.json(await getMovie(tmdbId));
});

export default moviesRouter;
