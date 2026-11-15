# Movie Night

A group movie picker that settles the debate fairly. One person creates a
**night** with a runtime cap and shares a join code. Everyone joins, suggests
films found through TMDB, ranks their top three and uses one veto. The server
computes a fair winner and explains why every other film lost.

Miguel Aoun (242464) · Sara Abi Ghosn (240073)

> This repo currently holds the **back end** (Milestones 1–3, server side).
> The React client goes in `client/`.
>
> **Change from the proposal:** the database is MongoDB (Atlas) instead of
> PostgreSQL. The tables map one-to-one to collections; see `docs/schema.md`.

## Tech stack

| Part      | Choice |
|-----------|--------|
| Back end  | Node.js 20+, Express 5, ES modules (`"type": "module"`), dotenv |
| Validation & security | zod, helmet, express-rate-limit, Mongoose `sanitizeFilter` |
| Database  | MongoDB (Atlas) with Mongoose |
| Auth      | bcrypt password hashes, JWT (1 h expiry) sent as `Authorization: Bearer <token>` |
| Third-party API | TMDB (search + movie details), called only from the server |
| Front end (next) | React + Vite, React Router |

## Setup

```bash
cd server
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # node --watch, restarts on every save
# Connected to MongoDB
# Listening on port 3000
```

| Variable        | Example | What it is |
|-----------------|---------|------------|
| `PORT`          | `3000` | API port |
| `MONGODB_URI`   | `mongodb+srv://…/movie-night` | Atlas connection string |
| `JWT_SECRET`    | `node -p "crypto.randomBytes(32).toString('hex')"` | Signs tokens. Long and random |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The Vite app's origin, for CORS. No trailing `/` |
| `TMDB_TOKEN`    | TMDB "API Read Access Token" | Stays on the server |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` | Optional |

`.env` is git-ignored; only `.env.example` is committed. `server.js` loads
`.env` with `import 'dotenv/config'` on its first line. In production there is
no `.env` file; the variables come from the host's settings page. The server
refuses to start and names any variable that is missing.

Try every route with `server/requests.http` (VS Code **REST Client**
extension), or with curl:

```bash
curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@uni.edu","password":"hunter22!"}'
```

## Features (back end)

- Sign up, log in, "who am I" with JWT; passwords hashed with bcrypt (cost 12)
- Search films and get details (runtime, rating) through TMDB, cached 10 min
- Create a night (title, runtime cap); the server generates a 6-character join code
- Join with a code; see the nights you own or joined (history, `?status=`)
- Add and remove suggestions (yours, or any if you own the night)
- Save a ballot: top three ranked + one veto
- Result: winner, runners-up and a reason for every film that lost
- Owner can rename, change the cap, close voting, or delete the night
  (deleting removes its suggestions and votes)

### Security

- **helmet** sets secure headers and removes `X-Powered-By`
- **Rate limits**: 300 requests / 15 min per IP on `/api`; 5 *failed* logins / 15 min
  on `/api/auth/login` (429 `{ error }`)
- **Body size** capped at 10 kB
- **zod** checks every request body and strips fields it doesn't declare
  (title ≤ 80 chars, `maxRuntimeMin` 30–400, join code 6 chars, ranking ≤ 3 ids)
- **`sanitizeFilter`** neutralises `{ "$ne": … }` style injection in queries

### The scoring algorithm (`server/utils/scoring.js`)

1. Drop films longer than the runtime cap → *"Runs 179 min, over the 150-min cap"*
2. Drop vetoed films → *"Vetoed by 1 person"*
3. Score the rest: 1st choice = 3 pts, 2nd = 2, 3rd = 1 → *"6 pts vs the winner's 7 pts"*
4. Ties: higher TMDB rating wins → *"Tied on 5 pts, lower TMDB rating (7.0 vs 8.0)"*, then title A–Z

## API

Base URL: `http://localhost:3000/api`. Every body is JSON. Every error is
`{ "error": "message" }`.

| Method | Path | Auth | Success | Can fail |
|--------|------|------|---------|----------|
| GET    | `/health` | – | 200 | – |
| POST   | `/auth/signup` `{ email, password, displayName }` | – | 201 `{ token, user }` | 400, 409 |
| POST   | `/auth/login` `{ email, password }` | – | 200 `{ token, user }` | 400, 401, 429 |
| GET    | `/auth/me` | ✔ | 200 `{ user }` | 401 |
| GET    | `/movies/search?query=&page=` | – | 200 `{ page, totalPages, results }` | 400, 502 |
| GET    | `/movies/:tmdbId` | – | 200 movie | 400, 404, 502 |
| GET    | `/nights?status=open\|closed` | ✔ | 200 `[night]` | 401 |
| POST   | `/nights` `{ title, maxRuntimeMin }` | ✔ | 201 night | 400, 401 |
| GET    | `/nights/:id` | ✔ member | 200 night + `members`, `suggestions`, `myBallot`, `ballotsCast`, `isOwner` | 401, 404 |
| PATCH  | `/nights/:id` `{ title?, maxRuntimeMin?, status? }` | ✔ owner | 200 night | 400, 401, 403, 404 |
| DELETE | `/nights/:id` | ✔ owner | 204 | 401, 403, 404 |
| POST   | `/memberships` `{ joinCode }` (join a night) | ✔ | 201 night (200 if already in) | 400, 401, 404 |
| POST   | `/nights/:id/suggestions` `{ tmdbId }` | ✔ member | 201 suggestion | 400, 401, 404, 409 |
| DELETE | `/nights/:id/suggestions/:suggestionId` | ✔ adder or owner | 204 | 400, 401, 403, 404 |
| GET    | `/nights/:id/ballot` | ✔ member | 200 `{ ranking, veto }` | 401, 404 |
| PUT    | `/nights/:id/ballot` `{ ranking: [id…≤3], veto: id\|null }` | ✔ member | 200 ballot | 400, 401, 404 |
| GET    | `/nights/:id/result` | ✔ member | 200 `{ final, winner, standings, ballots }` | 401, 404 |

- **401**: no token, bad token or expired token. **403**: you're a member but
  not allowed (not the owner). **404**: not found *or not yours*. A night you
  aren't a member of looks exactly like one that doesn't exist.
- **409**: duplicates (email taken, film already suggested), even when two
  identical requests arrive at the same moment (the unique index catches it).
- Closed nights refuse new members, suggestions, removals and ballots (400).
- URLs name things, not actions: joining a night *creates a membership*
  (`POST /memberships`), and voting *replaces your ballot* (`PUT …/ballot`).

### For the React client (Milestone 3)

- Send `Authorization: Bearer <token>` on every `/api/nights` request.
- On **401**, clear the token and show the login page (the token lasts 1 hour).
- **204** responses have no body; don't call `res.json()` on them.
- Set `VITE_API_URL=http://localhost:3000` in `client/.env.development`, and make
  `CLIENT_ORIGIN` in `server/.env` match the Vite origin exactly.

## Architecture

```
React (Vite) :5173 ──fetch + Bearer token──▶ Express API :3000 ──Mongoose──▶ MongoDB Atlas
                                                    │
                                                    └──fetch + server token──▶ TMDB
```

Every request runs the line in order:
`helmet → cors → express.json() → logger → rate limit → router → (requireAuth → validate(zod) → route) → 404 → errorHandler`

```
server/
├── app.js                 the Express app: middleware order + routes (exports app)
├── server.js              starts it: loads .env, env check, connect DB, then listen
├── db.js                  mongoose.connect
├── auth/token.js          signToken / verifyToken (JWT)
├── middleware/
│   ├── logger.js          time METHOD path
│   ├── requireAuth.js     Bearer token → req.userId, else 401
│   ├── validate.js        zod schemas + validate(schema) middleware → 400
│   └── errorHandler.js    bad JSON → 400, duplicate → 409, anything else → 500 (no crash)
├── models/                User, Night, Suggestion, Vote
├── routes/
│   ├── auth.js            /api/auth
│   ├── movies.js          /api/movies (TMDB proxy)
│   ├── nights.js          /api/nights (+ suggestions, ballot, result)
│   └── memberships.js     /api/memberships (join with a code)
├── services/tmdb.js       TMDB calls + 10-min cache
├── utils/                 scoring.js, joinCode.js, httpError.js
└── requests.http          every route, ready to send
```

Database schema: [`docs/schema.md`](docs/schema.md).

## Milestones

| Tag | What |
|-----|------|
| `milestone-1` | Server scaffold, `.env.example`, final MongoDB schema |
| `milestone-2` | Auth (signup, login, protected routes) + CRUD for nights, suggestions, votes |
| `milestone-3` | Back end ready for the client: CORS from config, env check, API docs, request collection |
