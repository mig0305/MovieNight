# Movie Night

## Live Application

- **Frontend (Vercel):** https://movienight-alpha.vercel.app
- **Backend API (Render):** https://movienight-api.onrender.com
- **API Health Check:** https://movienight-api.onrender.com/api/health

## Overview

Movie Night is publicly deployed using Vercel for the React
frontend, Render for the Express backend, and MongoDB Atlas
for persistent database storage.
A group movie picker that settles the debate fairly. One person creates a
**night** with a runtime cap and shares a join code. Everyone joins, suggests
films found through TMDB, ranks their top three and may use one veto. The host
closes voting, and the server computes a fair winner and explains why every
other film lost. Each user also keeps a personal **watchlist**, and a
**history** of every finished night.

Miguel Aoun (242464) · Sara Abi Ghosn (240073)

> **Change from the proposal:** the database is MongoDB (Atlas) instead of
> PostgreSQL. The tables map one-to-one to collections; see `docs/schema.md`.

## Tech stack

| Part      | Choice |
|-----------|--------|
| Front end | React 19 + Vite, React Router, Vitest + Testing Library, oxlint |
| Back end | Node.js 24.x, Express 5, ES modules (`"type": "module"`), dotenv |
| Validation & security | zod, helmet, express-rate-limit, Mongoose `sanitizeFilter` |
| Database  | MongoDB (Atlas) with Mongoose |
| Auth      | bcrypt password hashes, JWT (1 h expiry) sent as `Authorization: Bearer <token>` |
| Third-party API | TMDB, accessed exclusively through the Express backend |

## Setup

You need **Node.js 24.x**, a **MongoDB Atlas** database and a
**TMDB API Read Access Token** (themoviedb.org → Settings → API).


The TMDB token is configured exclusively on the backend:
in `server/.env` during local development and through Render
environment variables in production.

It is never required or exposed in the React frontend.


### 1. Back end

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
| `PORT` | `3000` | Optional API port; defaults to `3000` |
| `MONGODB_URI` | `mongodb+srv://…/<database-name>` | Atlas connection string |
| `JWT_SECRET`    | `node -p "crypto.randomBytes(32).toString('hex')"` | Signs tokens. Long and random |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The Vite app's origin, for CORS. No trailing `/` |
| `TMDB_TOKEN`    | TMDB "API Read Access Token" | Used by the server's `/api/movies` routes |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` | Optional |

The server refuses to start if any required variable is missing:
`MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, or `TMDB_TOKEN`.

`PORT` defaults to `3000`, and `TMDB_BASE_URL` is optional.


### 2. Front end (in a second terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

No TMDB credentials or frontend `.env` file are required for local development.

The Vite development server proxies `/api` requests to the Express backend
running on `http://127.0.0.1:3000`.

The optional `VITE_API_URL` variable can be used to specify a different
backend origin. It is a public URL, not a secret. Leave it empty when
using the local Vite proxy.

`.env` files are git-ignored; only the `.env.example` files are committed.


## Production Deployment

### Hosting Architecture

| Component | Hosting Platform | Root Directory |
|---|---|---|
| React frontend | Vercel | `client/` |
| Express REST API | Render | `server/` |
| Database | MongoDB Atlas | Cloud-hosted |

Both hosting platforms use the `frontend-integration` branch.

### Frontend Configuration

- Framework: React and Vite
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- API origin configured through `VITE_API_URL`
- React Router rewrites configured in `client/vercel.json`

### Backend Configuration

- Runtime: Node.js
- Root directory: `server`
- Build command: `npm ci`
- Start command: `npm start`
- Port dynamically assigned by Render
- Public health endpoint: `/api/health`

### Environment Variables and Security


| Platform | Environment variable | Production value |
|---|---|---|
| Vercel | `VITE_API_URL` | `https://movienight-api.onrender.com` |
| Render | `CLIENT_ORIGIN` | `https://movienight-alpha.vercel.app` |
| Render | `MONGODB_URI` | Private Atlas connection string |
| Render | `JWT_SECRET` | Private production signing secret |
| Render | `TMDB_TOKEN` | Private TMDB Read Access Token |
| Render | `TMDB_BASE_URL` | `https://api.themoviedb.org/3` |
| Render | `NODE_ENV` | `production` |

Origins must include `https://`, without trailing slashes
or additional paths.

Changes to `VITE_API_URL` require rebuilding and redeploying
the frontend because Vite environment variables are embedded
at build time.

Private environment variable values must never be committed
to Git or exposed to the browser.


Production environment variables are configured directly
through the Vercel and Render dashboards.

The frontend uses `VITE_API_URL` to communicate with the
deployed Express API over HTTPS.

Database credentials, JWT secrets and TMDB credentials
are stored exclusively on the backend.

The backend uses `CLIENT_ORIGIN` to configure CORS for
the deployed frontend.

Private environment files are excluded from Git.

### Database and External API

The application uses the existing MongoDB Atlas database
for persistent storage.

Authenticated TMDB API requests are handled exclusively
by the Express backend.

Public movie posters, backdrops and provider logos are
loaded directly from TMDB's public image resources.

### Production Notes

The deployed application operates independently of the
local development environment.

React Router supports direct page access and browser
refreshes through the Vercel rewrite configuration.

The Render free-tier backend may require a cold start
after a period of inactivity.

## Features

- **Accounts:** sign up, log in, log out; the session is restored on refresh
  and ends automatically when the 1-hour token expires
- **Discover:** popular movies, search, movie details and where to watch
- **Movie nights:** create a night (title, runtime cap); share the 6-character
  join code; see the nights you host or joined
- **Night room:** members, host, live updates every 15 seconds, search TMDB
  through Express and suggest films. Films with no runtime or over the cap are
  refused by React **and** by Express; a film can only be suggested once
- **Voting:** rank your top three and use one optional veto; update your ballot
  until voting closes
- **Finalization:** only the host can close voting, and only after at least
  one ballot. A closed night is locked
- **Results:** the official winner, runners-up and excluded films, each with
  the server's explanation. Every member sees the same result
- **Watchlist:** save movies, mark them watched, filter, remove. Stored in
  MongoDB per user
- **History:** every closed night you took part in, with its winner; search
  and sort

### The scoring algorithm (`server/utils/scoring.js`)

1. Drop films longer than the runtime cap → *"Runs 179 min, over the 150-min cap"*
2. Drop vetoed films → *"Vetoed by 1 person"*
3. Score the rest: 1st choice = 3 pts, 2nd = 2, 3rd = 1 → *"6 pts vs the winner's 7 pts"*
4. Ties: higher TMDB rating wins → *"Tied on 5 pts, lower TMDB rating (7.0 vs 8.0)"*, then title A–Z

The result is computed by the server on every request and never stored. That
is safe because a closed night can no longer change.

### Security

- **helmet** sets secure headers and removes `X-Powered-By`
- **Rate limits**: 300 requests / 15 min per IP on `/api`; 5 *failed* logins / 15 min
  on `/api/auth/login` (429 `{ error }`)
- **Body size** capped at 10 kB
- **zod** checks every request body and strips fields it doesn't declare
- **`sanitizeFilter`** neutralises `{ "$ne": … }` style injection in queries
- The owner of a night, a suggestion or a watchlist item always comes from the
  JWT, never from the request body; movie details always come from TMDB


### API Base URLs

- **Local development:** `http://localhost:3000/api`
- **Production:** `https://movienight-api.onrender.com/api`

Request and response bodies, when present, use JSON.
API errors follow the format `{ "error": "message" }`.


| Method | Path | Auth | Success | Can fail |
|--------|------|------|---------|----------|
| GET    | `/health` | – | 200 | – |
| POST   | `/auth/signup` `{ email, password, displayName }` | – | 201 `{ token, user }` | 400, 409 |
| POST   | `/auth/login` `{ email, password }` | – | 200 `{ token, user }` | 400, 401, 429 |
| GET    | `/auth/me` | ✔ | 200 `{ user }` | 401 |
| GET    | `/movies/popular?page=` | – | 200 `{ page, totalPages, results }` | 400, 502 |
| GET    | `/movies/search?query=&page=` | – | 200 `{ page, totalPages, results }` | 400, 502 |
| GET    | `/movies/:tmdbId/providers` | – | 200 country-specific providers | 400, 404, 502 |
| GET    | `/movies/:tmdbId` | – | 200 normalized movie details | 400, 404, 502 |
| GET    | `/nights?status=open\|closed` | ✔ | 200 `[night]` | 401 |
| POST   | `/nights` `{ title, maxRuntimeMin }` | ✔ | 201 night | 400, 401 |
| GET    | `/nights/:id` | ✔ member | 200 night + `members`, `suggestions`, `myBallot`, `ballotsCast`, `isOwner` | 401, 404 |
| PATCH  | `/nights/:id` `{ title?, maxRuntimeMin?, status? }` | ✔ owner | 200 night | 400, 401, 403, 404 |
| DELETE | `/nights/:id` | ✔ owner | 204 | 401, 403, 404 |
| POST   | `/memberships` `{ joinCode }` (join a night) | ✔ | 201 night (200 if already in) | 400, 401, 404 |
| POST   | `/nights/:id/suggestions` `{ tmdbId }` | ✔ member | 201 suggestion | 400, 401, 404, 409 |
| DELETE | `/nights/:id/suggestions/:suggestionId` | ✔ adder or owner | 204 | 400, 401, 403, 404 |
| GET    | `/nights/:id/ballot` | ✔ member | 200 `{ ranking, veto }` | 401, 404 |
| PUT    | `/nights/:id/ballot` `{ ranking: [id×3], veto: id\|null }` | ✔ member | 200 ballot | 400, 401, 404 |
| GET    | `/nights/:id/result` | ✔ member | 200 `{ final, winner, standings, ballots }` | 401, 404 |
| GET    | `/watchlist` | ✔ | 200 `[item]` (mine, newest first) | 401 |
| POST   | `/watchlist` `{ tmdbId }` | ✔ | 201 item | 400, 401, 404, 409 |
| PATCH  | `/watchlist/:tmdbId` `{ watched }` | ✔ | 200 item | 400, 401, 404 |
| DELETE | `/watchlist/:tmdbId` | ✔ | 204 | 401, 404 |

- **401**: no token, bad token or expired token. **403**: you're a member but
  not allowed (not the owner). **404**: not found *or not yours*. A night you
  aren't a member of looks exactly like one that doesn't exist.
- **409**: duplicates (email taken, film already suggested, movie already in
  your watchlist), even when two identical requests arrive at the same moment.
- **400** on business rules: a film with no runtime or over the cap; closing a
  night with no ballots; any change to a closed night (new members,
  suggestions, removals, ballots, edits).

Every route is ready to send in `server/requests.http` (VS Code **REST Client**).

## Architecture
### Local Development Architecture

                 React Frontend (Vite :5173)
                            |
                  /api requests via fetch
                            |
                     Vite Proxy
                            |
                            v
                   Express Backend :3000
                     /             \
                    /               \
                   v                 v
             TMDB API          MongoDB Atlas
           (TMDB_TOKEN)          (Mongoose)
                    |
                    v
             Movie information

React Frontend
      |
      v
TMDB public image URLs
(image.tmdb.org)
      |
      v
Posters, backdrops and provider logos


### Production Architecture

```text
         User's Browser
               |
               v
       React Frontend
           Vercel
               |
       HTTPS REST API
        VITE_API_URL
               |
               v
       Express Backend
           Render
          /      \
         /        \
        v          v
    TMDB API    MongoDB Atlas
  (TMDB_TOKEN)    (Mongoose)
```

In production, the browser communicates directly with the deployed
Express backend over HTTPS. The Vite development proxy is not used.

The backend permits requests from the deployed frontend through
the `CLIENT_ORIGIN` environment variable.

Public movie images continue to be loaded directly from TMDB's
public image resources.


All authenticated TMDB API requests originate from Express.
The TMDB Read Access Token is configured through backend environment
variables, using `server/.env` locally and the Render dashboard in production.
The frontend communicates with Express through `apiRequest()`.

Movie posters, backdrops and provider logos are loaded directly
from TMDB's public image resources. These image URLs do not require
the API authentication token.

Every API request runs the line in order:
`helmet → cors → express.json() → logger → rate limit → router → (requireAuth → validate(zod) → route) → 404 → errorHandler`

```
client/src/
├── api/            backend.js (apiRequest + JWT), nights.js, movies.js, watchlist.js, tmdbImages.js
├── auth/           AuthContext (login state, session restore, expiry) + useAuth
├── components/     NavBar, MovieCard, NightCard, SearchBar, LoadingIndicator, WhereToWatch
└── pages/          Discover, MovieDetails, Login, Signup, Nights, CreateNight, JoinNight,
                    NightRoom, Vote, Results, Watchlist, History (+ *.test.jsx)

server/
├── app.js          the Express app: middleware order + routes (exports app)
├── server.js       starts it: loads .env, env check, connect DB, then listen
├── auth/token.js   signToken / verifyToken (JWT)
├── middleware/     logger, requireAuth, validate (zod), errorHandler
├── models/         User, Night, Suggestion, Vote, WatchlistItem
├── routes/         auth, movies (TMDB proxy), nights (+ suggestions, ballot, result),
│                   memberships (join with a code), watchlist
├── services/tmdb.js  TMDB calls + 10-min cache
├── utils/          scoring.js, joinCode.js, httpError.js
└── tests/          api, movies, scoring, watchlist
```

Database schema: [`docs/schema.md`](docs/schema.md).

## Tests and checks

```bash
npm --prefix client test        # React component tests (Vitest + Testing Library)
npm --prefix client run lint    # oxlint
npm --prefix client run build   # production build
npm --prefix server test        # API, validation, security and scoring tests
```

The server tests import `app.js` without starting a server or requiring
a MongoDB connection. Movie endpoint tests mock TMDB responses, so
they do not depend on the external TMDB service.

The client tests mock API functions, so they do not require Express, MongoDB or TMDB to run.

`npm audit` reports advisories only in development tools (Vitest/Vite's file
matching); `npm audit --omit=dev` reports **0 vulnerabilities** for both the
client and the server.

## Milestones

## Internal Full-Stack Integration Milestones

| Integration Milestone | What |
|-----|------|
| 1 | Frontend ↔ backend connection: Vite proxy, `apiRequest()`, health check |
| 2 | Authentication: signup, login, logout, JWT, session restore and expiry |
| 3 | Movie nights dashboard: My Nights, create and join, persisted in MongoDB |
| 4 | Night room and suggestions: TMDB search via Express, runtime rules, live refresh |
| 5 | Voting: ranked ballots and vetoes saved per user |
| 6 | Finalization and results: host closes voting, official server-computed result |
| 7 | Watchlist and history: personal watchlist in MongoDB, history of closed nights |
| 8 | End-to-end testing, cleanup and documentation |


## Official Capstone Milestones

The following milestones correspond to the official
Web Programming Capstone Milestones requirements.

| Milestone | Deliverable | Status |
|---|---|---|
| 1 | Project scaffold, wireframes and database schema | Completed |
| 2 | Core backend functionality, authentication and CRUD routes | Completed |
| 3 | Frontend-backend integration and core application features | Completed |
| 4 | Public deployment using Vercel, Render and MongoDB Atlas | Completed |
