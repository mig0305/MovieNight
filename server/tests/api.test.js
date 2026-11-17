// API tests (Vitest + Supertest). Run: npm test
// They import app.js, NOT server.js: no database and no port needed,
// because every request here is answered before any database call.
import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.JWT_SECRET ??= 'test-secret';
const { default: app } = await import('../app.js');
const { signToken } = await import('../auth/token.js');

const token = signToken({ _id: '66f1c2e4b7a1d3f0c8e2a9b1' });
const auth = { Authorization: `Bearer ${token}` };

describe('auth', () => {
  it('protected route without a token -> 401', async () => {
    const res = await request(app).get('/api/nights');
    expect(res.status).toBe(401);
  });

  it('protected route with a fake token -> 401', async () => {
    const res = await request(app).get('/api/nights').set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

describe('validation (zod)', () => {
  it('signup with a short password -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'sara@usj.edu', password: '123', displayName: 'Sara' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it('create a night without a title -> 400', async () => {
    const res = await request(app).post('/api/nights').set(auth).send({ maxRuntimeMin: 120 });
    expect(res.status).toBe(400);
  });

  it('ballot with 4 films ranked -> 400', async () => {
    const id = '66f1c2e4b7a1d3f0c8e2a9b1';
    const res = await request(app)
      .put(`/api/nights/${id}/ballot`)
      .set(auth)
      .send({ ranking: [id, id, id, id] });
    expect(res.status).toBe(400);
  });

  it('a night id that is not an ObjectId -> 404', async () => {
    const res = await request(app).get('/api/nights/123').set(auth);
    expect(res.status).toBe(404);
  });

  it('unknown route -> 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
  
  it('ballot with only 2 ranked films -> 400', async () => {
    const id1 = '66f1c2e4b7a1d3f0c8e2a901';
    const id2 = '66f1c2e4b7a1d3f0c8e2a902';
    const nightId = '66f1c2e4b7a1d3f0c8e2a905';

    const res = await request(app)
      .put(`/api/nights/${nightId}/ballot`)
      .set(auth)
      .send({
        ranking: [id1, id2],
        veto: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exactly 3/i);
  });

  it('ballot with repeated ranked film -> 400', async () => {
    const id1 = '66f1c2e4b7a1d3f0c8e2a901';
    const id3 = '66f1c2e4b7a1d3f0c8e2a903';
    const nightId = '66f1c2e4b7a1d3f0c8e2a905';

    const res = await request(app)
      .put(`/api/nights/${nightId}/ballot`)
      .set(auth)
      .send({
        ranking: [id1, id1, id3],
        veto: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/same film twice/i);
  });

  it('ballot cannot veto a ranked film -> 400', async () => {
    const id1 = '66f1c2e4b7a1d3f0c8e2a901';
    const id2 = '66f1c2e4b7a1d3f0c8e2a902';
    const id3 = '66f1c2e4b7a1d3f0c8e2a903';
    const nightId = '66f1c2e4b7a1d3f0c8e2a905';

    const res = await request(app)
      .put(`/api/nights/${nightId}/ballot`)
      .set(auth)
      .send({
        ranking: [id1, id2, id3],
        veto: id1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rank and veto/i);
  });

});

// ---------- S21 security fixes, locked in ----------
describe('security', () => {
  it('helmet: security headers on, X-Powered-By gone', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('injection: login with {"$ne": null} -> 400, never reaches Mongo', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  it('injection: join with {"$ne": "x"} -> 400', async () => {
    const res = await request(app).post('/api/memberships').set(auth).send({ joinCode: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  it('body bigger than 10kb -> 413', async () => {
    const res = await request(app)
      .post('/api/nights')
      .set(auth)
      .send({ title: 'x'.repeat(20_000), maxRuntimeMin: 120 });
    expect(res.status).toBe(413);
  });

  // keep this one last: it uses up the login limit
  it('brute force: the 6th login attempt in 15 minutes -> 429', async () => {
    let res;
    for (let i = 0; i < 6; i++) {
      res = await request(app).post('/api/auth/login').send({});
    }
    expect(res.status).toBe(429);
  });
});