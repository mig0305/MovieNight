# Movie Night: database schema (MongoDB, final)

The proposal sketched the schema for PostgreSQL. This is the final version for
**MongoDB with Mongoose**. Five collections; references are `ObjectId`s with
`ref`, like `userId` in the course's Note model.

```
users 1 ──owns──── N nights
users N ──members── N nights        (array of user ids inside the night)
nights 1 ──has──── N suggestions
nights 1 ──has──── N votes          (one ballot per user per night)
votes  ──ranking/veto──> suggestions
users 1 ──saves─── N watchlistitems  (personal, one per user per film)
```

## users

| Field          | Type     | Rules                                  |
|----------------|----------|----------------------------------------|
| `_id`          | ObjectId | primary key (automatic)                |
| `email`        | String   | required, **unique**, lowercase, trim  |
| `passwordHash` | String   | required, bcrypt hash (never `password`) |
| `displayName`  | String   | required, trim                         |
| `createdAt` / `updatedAt` | Date | `timestamps: true`              |

## nights

| Field           | Type       | Rules                                       |
|-----------------|------------|---------------------------------------------|
| `_id`           | ObjectId   | primary key                                 |
| `owner`         | ObjectId → users | required. Only the owner can edit/delete |
| `title`         | String     | required                                    |
| `joinCode`      | String     | required, **unique**, uppercase, 6 chars    |
| `maxRuntimeMin` | Number     | required, ≥ 30-400 minutes (runtime cap)    |
| `status`        | String     | `open` or `closed`, default `open`          |
| `members`       | [ObjectId → users] | replaces the `night_members` table; owner is added on create |
| `createdAt` / `updatedAt` | Date |                                      |

## suggestions

| Field         | Type       | Rules                                  |
|---------------|------------|----------------------------------------|
| `_id`         | ObjectId   | primary key                            |
| `night`       | ObjectId → nights | required                        |
| `tmdbId`      | Number     | required                               |
| `title`       | String     | required (copied from TMDB)            |
| `posterPath`  | String     | nullable                               |
| `runtime`     | Number     | minutes, nullable                      |
| `voteAverage` | Number     | TMDB rating, used to break ties        |
| `addedBy`     | ObjectId → users | required                         |

Index: `{ night, tmdbId }` **unique**, so a film is suggested once per night.

## votes (one ballot per user per night)

| Field     | Type                     | Rules                                       |
|-----------|--------------------------|---------------------------------------------|
| `_id`     | ObjectId                 | primary key                                 |
| `night`   | ObjectId → nights        | required                                    |
| `user`    | ObjectId → users         | required                                    |
| `ranking` | [ObjectId → suggestions] | exactly 3 distinct ids; index 0 = 1st choice (3 pts), 1 = 2 pts, 2 = 1 pt |
| `veto`    | ObjectId → suggestions   | nullable; can't also be in `ranking`        |

Index: `{ night, user }` **unique**. Storing the ballot as one document makes
"rank your top three, use one veto" a single write and enforces "one veto per
user per night" by shape instead of by query.

## watchlistitems (personal watchlist, added in Milestone 7)

| Field         | Type             | Rules                                   |
|---------------|------------------|-----------------------------------------|
| `_id`         | ObjectId         | primary key                             |
| `user`        | ObjectId → users | required; always taken from the token   |
| `tmdbId`      | Number           | required                                |
| `title`       | String           | required (copied from TMDB)             |
| `posterPath`  | String           | nullable                                |
| `releaseDate` | String           | nullable, `YYYY-MM-DD`                  |
| `runtime`     | Number           | minutes, nullable                       |
| `voteAverage` | Number           | TMDB rating                             |
| `watched`     | Boolean          | default `false`                         |
| `watchedAt`   | Date             | set when marked watched, else `null`    |
| `createdAt` / `updatedAt` | Date |                                        |

Index: `{ user, tmdbId }` **unique**, so a film is saved once per user (two
users can each save it). Every `/api/watchlist` query filters by
`user: req.userId`, so nobody can read or change someone else's list.

## Rules the API enforces

- Every `/api/nights` query filters by membership (`members: req.userId`).
  Someone else's night → **404**.
- Owner-only actions (edit, close, delete the night) → **403** for other members.
- Deleting a night deletes its suggestions and votes.
- Deleting a suggestion deletes any ballot that ranked that movie, requiring the affected user to vote again. If the movie was only vetoed,
the ballot is preserved and its veto is set to `null`.
- Joining, suggesting and voting are refused once a night is `closed`.
- A suggestion is refused (400) if its TMDB runtime is missing or over the
  night's `maxRuntimeMin` (Milestone 4).
- Closing a night needs at least one ballot, and a closed night can no longer
  be edited or reopened (400), so its result never changes (Milestone 6).
  Its `updatedAt` is therefore the moment voting closed.
- Unique indexes (`email`, `joinCode`, `{night, tmdbId}`, `{night, user}`,
  `{user, tmdbId}` on watchlist items) are the last line of defence: two
  identical requests at the same instant get **409**, not a duplicate.