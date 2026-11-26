// Watchlist API tests. Like api.test.js, every request here is answered
// before any database call, so no MongoDB and no TMDB token are needed.
import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.JWT_SECRET ??= 'test-secret';
const { default: app } = await import('../app.js');
const { signToken } = await import('../auth/token.js');

const token = signToken({ _id: '66f1c2e4b7a1d3f0c8e2a9b1' });
const auth = { Authorization: `Bearer ${token}` };

describe('watchlist', () => {
  it('without a token -> 401', async () => {
    const res = await request(app).get('/api/watchlist');
    expect(res.status).toBe(401);
  });

  it('adding without a tmdbId -> 400', async () => {
    const res = await request(app).post('/api/watchlist').set(auth).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tmdbId/);
  });

  it('adding with a text tmdbId -> 400', async () => {
    const res = await request(app).post('/api/watchlist').set(auth).send({ tmdbId: 'abc' });
    expect(res.status).toBe(400);
  });

  it('marking watched with a non-boolean -> 400', async () => {
    const res = await request(app).patch('/api/watchlist/862').set(auth).send({ watched: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/true or false/);
  });

  it('injection: {"$ne": null} as tmdbId -> 400', async () => {
    const res = await request(app).post('/api/watchlist').set(auth).send({ tmdbId: { $ne: null } });
    expect(res.status).toBe(400);
  });
});