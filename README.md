# Movie Night

A group movie picker: create a night, share a join code, suggest films from TMDB, rank your top three, use one veto, and let the server pick a fair winner.

## Milestone 1: scaffold

- `server/`: Express + MongoDB (Mongoose) API. `client/` (React + Vite) comes next.
- Database schema: [`docs/schema.md`](docs/schema.md)

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, ...
npm run dev            # API listening on :3000
curl localhost:3000/api/health
```
