import express from 'express';

import { searchMovies, getMovie, getPopularMovies, getWatchProviders } from '../services/tmdb.js';

const moviesRouter = express.Router();

// Validate pagination values received through query parameters.
function parsePage(value) {
    if (typeof value !== 'string') return null;

    const page = Number(value);

    return Number.isInteger(page) && page >= 1
        ? page
        : null;
}

// Validate TMDB movie IDs.
function parseTmdbId(value) {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0
        ? id
        : null;
}

// GET /api/movies/search?query=inception&page=1
moviesRouter.get('/search', async (req, res) => {
    const { query } = req.query;
    const pageNumber = parsePage(req.query.page ?? '1');

    if (typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({
            error: 'query is required'
        });
    }

    if (pageNumber === null) {
        return res.status(400).json({
            error: 'page must be a number from 1'
        });
    }

    res.json(await searchMovies(query.trim(), pageNumber));
});

// GET /api/movies/popular?page=1
moviesRouter.get('/popular', async (req, res) => {
    const pageNumber = parsePage(req.query.page ?? '1');

    if (pageNumber === null) {
        return res.status(400).json({
            error: 'page must be a number from 1'
        });
    }

    res.json(await getPopularMovies(pageNumber));
});

// GET /api/movies/:tmdbId/providers
moviesRouter.get('/:tmdbId/providers', async (req, res) => {
    const tmdbId = parseTmdbId(req.params.tmdbId);

    if (tmdbId === null) {
        return res.status(400).json({
            error: 'tmdbId must be a positive number'
        });
    }

    res.json(await getWatchProviders(tmdbId));
});

// GET /api/movies/:tmdbId
moviesRouter.get('/:tmdbId', async (req, res) => {
    const tmdbId = parseTmdbId(req.params.tmdbId);

    if (tmdbId === null) {
        return res.status(400).json({
            error: 'tmdbId must be a positive number'
        });
    }

    res.json(await getMovie(tmdbId));
});

export default moviesRouter;
