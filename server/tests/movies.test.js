import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import request from 'supertest';

// Use a fake token: tests will not contact the real TMDB API.
process.env.TMDB_TOKEN = 'test-tmdb-token';

// Import the Express application, not server.js.
// This avoids connecting to MongoDB or starting a port.
const { default: app } = await import('../app.js');

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Simulate a successful TMDB response.
function mockTmdbResponse(data) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

describe('TMDB movie endpoints', () => {

  // 1. Search movies
  it('GET /api/movies/search returns search results', async () => {
    mockTmdbResponse({
      page: 1,
      total_pages: 2,
      results: [
        {
          id: 157336,
          title: 'Interstellar',
          poster_path: '/poster.jpg',
          release_date: '2014-11-07',
          overview: 'A team travels through space.',
          vote_average: 8.6,
          vote_count: 30000,
        },
      ],
    });

    const res = await request(app)
      .get('/api/movies/search?query=interstellar&page=1');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(2);

    expect(res.body.results[0]).toMatchObject({
      tmdbId: 157336,
      title: 'Interstellar',
      posterPath: '/poster.jpg',
      voteAverage: 8.6,
      voteCount: 30000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    expect(new URL(url).pathname).toBe('/3/search/movie');
    expect(options.headers.Authorization).toBe(
      'Bearer test-tmdb-token'
    );
  });

  // 2. Popular movies
  it('GET /api/movies/popular returns popular movies', async () => {
    mockTmdbResponse({
      page: 2,
      total_pages: 5,
      results: [
        {
          id: 550,
          title: 'Fight Club',
          poster_path: '/fightclub.jpg',
          vote_average: 8.4,
        },
      ],
    });

    const res = await request(app)
      .get('/api/movies/popular?page=2');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.totalPages).toBe(5);

    expect(res.body.results[0]).toMatchObject({
      tmdbId: 550,
      title: 'Fight Club',
      posterPath: '/fightclub.jpg',
      voteAverage: 8.4,
    });

    const [url] = fetchMock.mock.calls[0];

    expect(new URL(url).pathname).toBe('/3/movie/popular');
  });

  // 3. Movie details
  it('GET /api/movies/:tmdbId returns complete movie details', async () => {
    mockTmdbResponse({
      id: 27205,
      title: 'Inception',
      poster_path: '/inception.jpg',
      backdrop_path: '/inception-backdrop.jpg',
      release_date: '2010-07-16',
      overview: "A thief enters people's dreams.",
      vote_average: 8.4,
      vote_count: 35000,
      runtime: 148,
      tagline: 'Your mind is the scene of the crime.',
      genres: [
        { id: 28, name: 'Action' },
        { id: 878, name: 'Science Fiction' },
      ],
    });

    const res = await request(app)
      .get('/api/movies/27205');

    expect(res.status).toBe(200);

    expect(res.body).toMatchObject({
      tmdbId: 27205,
      title: 'Inception',
      posterPath: '/inception.jpg',
      backdropPath: '/inception-backdrop.jpg',
      runtime: 148,
      voteCount: 35000,
      tagline: 'Your mind is the scene of the crime.',
      genres: [
        { id: 28, name: 'Action' },
        { id: 878, name: 'Science Fiction' },
      ],
    });

    const [url] = fetchMock.mock.calls[0];

    expect(new URL(url).pathname).toBe('/3/movie/27205');
  });

  // 4. Watch providers
  it('GET /api/movies/:tmdbId/providers returns country providers', async () => {
    const providers = {
      US: {
        link: 'https://www.themoviedb.org/',
        flatrate: [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/netflix.jpg',
          },
        ],
      },
      LB: {
        link: 'https://www.themoviedb.org/',
        flatrate: [],
      },
    };

    mockTmdbResponse({
      id: 27205,
      results: providers,
    });

    const res = await request(app)
      .get('/api/movies/27205/providers');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(providers);

    const [url] = fetchMock.mock.calls[0];

    expect(new URL(url).pathname).toBe(
      '/3/movie/27205/watch/providers'
    );
  });

  // 5. Invalid search request
  it('rejects a search without a query', async () => {
    const res = await request(app)
      .get('/api/movies/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('query is required');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 6. Invalid page number
  it('rejects an invalid page number', async () => {
    const res = await request(app)
      .get('/api/movies/popular?page=0');

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 7. Invalid movie ID
  it('rejects an invalid movie ID', async () => {
    const res = await request(app)
      .get('/api/movies/not-a-number');

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

});
