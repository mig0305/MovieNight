
import { httpError } from '../utils/httpError.js';

// TMDB is called only from the server, so the token never reaches the browser.
// Results are kept for 10 minutes to respect TMDB's rate limits.

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map(); // url -> { data, expires }

async function tmdbGet(path, params = {}) {
  const base = process.env.TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';

  const query = new URLSearchParams(params).toString();
  const url = `${base}${path}${query ? `?${query}` : ''}`;

  // Return cached results when available.
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  let res;

  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
        Accept: 'application/json',
      },
    });
  } catch {
    throw httpError(502, 'Could not reach the movie database');
  }

  if (res.status === 404) {
    throw httpError(404, 'Movie not found');
  }

  if (!res.ok) {
    throw httpError(502, `Movie database error (HTTP ${res.status})`);
  }

  const data = await res.json();

  // Keep memory usage bounded.
  if (cache.size >= 500) {
    cache.clear();
  }

  cache.set(url, {
    data,
    expires: Date.now() + CACHE_MS,
  });

  return data;
}

// Convert TMDB movie objects into our application's movie format.
const toMovie = (m) => ({
  tmdbId: m.id,
  title: m.title,
  posterPath: m.poster_path ?? null,
  backdropPath: m.backdrop_path ?? null,
  releaseDate: m.release_date ?? null,
  overview: m.overview ?? '',
  voteAverage: m.vote_average ?? 0,
  voteCount: m.vote_count ?? 0,
  runtime: m.runtime ?? null,
  tagline: m.tagline ?? '',
  genres: Array.isArray(m.genres) ? m.genres : [],
});

// Retrieve popular movies.
export async function getPopularMovies(page = 1) {
  const data = await tmdbGet('/movie/popular', { page });

  return {
    page: data.page,
    totalPages: data.total_pages,
    results: data.results.map(toMovie),
  };
}

// Search movies.
export async function searchMovies(query, page = 1) {
  const data = await tmdbGet('/search/movie', {
    query,
    page,
    include_adult: 'false',
  });

  return {
    page: data.page,
    totalPages: data.total_pages,
    results: data.results.map(toMovie),
  };
}

// Retrieve complete movie details.
export async function getMovie(tmdbId) {
  const data = await tmdbGet(`/movie/${tmdbId}`);

  return toMovie(data);
}

// Retrieve country-specific streaming and rental providers.
export async function getWatchProviders(tmdbId) {
  const data = await tmdbGet(
    `/movie/${tmdbId}/watch/providers`
  );

  return data.results ?? {};
}
