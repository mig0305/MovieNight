# Movie Night — Frontend Documentation

**React frontend architecture, components, pages, API communication and implementation guide.**


## Live Application

- **Frontend (Vercel):** https://movienight-alpha.vercel.app
- **Backend API (Render):** https://movienight-api.onrender.com/api
- **API Health Check:** https://movienight-api.onrender.com/api/health


## 1. Overview

Movie Night is a full-stack collaborative movie selection application. Its frontend is built with **React 19 and Vite** and communicates with an Express backend to provide movie discovery, user authentication, collaborative movie nights, voting, results, personal watchlists and viewing history.

The frontend is responsible for displaying information, collecting user input, managing interface state and communicating with the backend.

Persistent data, authentication verification, business-rule enforcement and official result calculations are handled by the backend and MongoDB.

### Main frontend responsibilities

- Display popular movies and allow users to search for films.
- Present detailed movie information and streaming availability.
- Provide signup, login and logout interfaces.
- Allow authenticated users to create and join movie nights.
- Display room members, suggested movies and voting progress.
- Allow members to submit and update their ballots.
- Display the official results returned by the backend.
- Manage personal watchlists and completed-night history.

## 2. Technology stack

| Technology | Purpose |
|---|---|
| React 19 | Building reusable components and interactive interfaces |
| Vite | Development server and production build tool |
| React Router | Client-side navigation and route management |
| JavaScript / JSX | Application logic and component rendering |
| React Hooks | State management and side effects |
| React Context API | Sharing authentication state across components |
| Fetch API | Communicating with the Express backend |
| CSS | Styling, responsive layouts and animations |
| Vitest | Frontend automated testing |
| React Testing Library | Testing components and user interactions |
| jsdom | Simulating a browser environment during tests |
| oxlint | Static code analysis |

## 3. Application architecture

The frontend does not communicate directly with MongoDB or make authenticated TMDB API requests.

Instead, all application data is retrieved through the Express backend.

### Local Development Architecture
```text
                 REACT FRONTEND
                  Vite :5173
                       |
                       |
              React components/pages
                       |
                       v
                 API MODULES
       backend.js / movies.js / nights.js
                 watchlist.js
                       |
                       v
                  apiRequest()
                       |
                       v
                 VITE PROXY
                       |
                       v
                EXPRESS BACKEND
                   :3000
                  /      \
                 /        \
                v          v
             TMDB API   MongoDB Atlas
                |        (Mongoose)
                |
                v
          Movie information
```

### Production Architecture

```text
          REACT FRONTEND
              Vercel
                |
                v
           API MODULES
  backend.js / movies.js / nights.js
          watchlist.js
                |
                v
           apiRequest()
                |
        HTTPS REST requests
           VITE_API_URL
                |
                v
         EXPRESS BACKEND
             Render
            /      \
           v        v
       TMDB API   MongoDB Atlas
                   (Mongoose)
```

The deployed frontend communicates directly with Express
over HTTPS using the backend origin configured through
`VITE_API_URL`.

The Vite proxy is used exclusively during local development.

Movie posters, backdrops and provider logos are a separate case:

```text
React Frontend
      |
      v
TMDB public image URLs
(image.tmdb.org)
      |
      v
Posters, backdrops and provider logos
```

These public image resources do not require the TMDB API authentication token.

### Important architectural distinction

- React handles the user interface and temporary presentation state.
- Express handles API requests, authentication, authorization and business rules.
- MongoDB stores persistent application data.
- TMDB provides external movie information.
- The backend calculates the official voting results.

The frontend never connects directly to MongoDB.

## 4. Getting started

### Requirements

- Node.js and npm.
- The complete Movie Night project containing `client/` and `server/`.
- A configured MongoDB Atlas database.
- A valid TMDB API Read Access Token configured on the backend.

Refer to the root [`README.md`](../README.md) for the complete backend configuration and environment variables.

### 4.1 Install frontend dependencies

From the project root:

```bash
npm --prefix client install
```

Alternatively:

```bash
cd client
npm install
```

### 4.2 Configure frontend environment variables

No frontend TMDB credentials are required.

The optional `VITE_API_URL` variable can specify the backend origin:

```env
VITE_API_URL=
```

Leave it empty during local development.

The existing Vite configuration automatically proxies `/api` requests to:

```text
http://127.0.0.1:3000
```

If a different backend origin is configured, provide only the origin, without appending `/api`.

**Security:** Never put `TMDB_TOKEN`, `JWT_SECRET`, MongoDB credentials or other private credentials in frontend environment variables. Variables beginning with `VITE_` are exposed to the browser.

### 4.3 Start the backend

Open the first terminal:

```bash
cd server
npm install
npm run dev
```

The backend should connect to MongoDB and listen on port 3000.

### 4.4 Start the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

Both processes must remain running while using the application locally.

The frontend communicates with Express through the Vite proxy, so both applications can operate simultaneously on the same computer.

## 5. Pages and routes

The application's routes are defined in `client/src/App.jsx`.

| Route | Page component | Access |
|---|---|---|
| `/` | DiscoverPage | Public |
| `/movie/:id` | MovieDetailsPage | Public |
| `/login` | LoginPage | Guest |
| `/signup` | SignupPage | Guest |
| `/nights` | NightsPage | Authenticated |
| `/nights/new` | CreateNightPage | Authenticated |
| `/nights/join` | JoinNightPage | Authenticated |
| `/nights/:id` | NightRoomPage | Authenticated |
| `/nights/:id/vote` | VotePage | Authenticated |
| `/nights/:id/results` | ResultsPage | Authenticated |
| `/watchlist` | WatchlistPage | Authenticated |
| `/history` | HistoryPage | Authenticated |
| Any unmatched route | 404 fallback | Public |

### 5.1 DiscoverPage.jsx

**Purpose:** Main movie discovery page.

Responsibilities:

- Retrieve popular movies through the Express backend.
- Search for movies by title.
- Display search results.
- Allow users to return to popular movies.
- Handle loading and error states.

It uses:

- `getPopularMovies()`
- `searchMovies()`
- `SearchBar`
- `MovieList`
- `LoadingIndicator`

### 5.2 MovieDetailsPage.jsx

**Purpose:** Display complete information about a selected movie.

Responsibilities:

- Retrieve movie details using its TMDB ID.
- Display the movie title, poster, backdrop, tagline, genres, release year, runtime, rating and overview.
- Display the external TMDB movie reference.
- Allow authenticated users to add movies to their watchlist, mark them as watched or remove them.
- Display streaming availability through `WhereToWatch`.
- Preserve the previous page when navigating back to movie details.

Movie details are retrieved through `getMovieDetails()`.

### 5.3 LoginPage.jsx and SignupPage.jsx

**Purpose:** Provide real user authentication interfaces.

Login:

- Collects email and password.
- Calls the login function provided by `AuthContext`.
- Displays authentication errors.
- Redirects successfully authenticated users to Discover.

Signup:

- Collects display name, email, password and password confirmation.
- Performs basic client-side validation.
- Calls the signup function provided by `AuthContext`.
- Redirects successfully registered users to Discover.

The backend remains responsible for verifying credentials, hashing passwords and issuing JWTs.

### 5.4 NightsPage.jsx

**Purpose:** Display the user's movie nights.

Responsibilities:

- Retrieve nights associated with the authenticated user.
- Display active and closed nights.
- Allow users to access individual rooms.
- Provide navigation to create or join a night.

Uses `getMyNights()` and the reusable `NightCard` component.

### 5.5 CreateNightPage.jsx

**Purpose:** Create a new movie night.

The user provides:

- Night title.
- Maximum movie runtime.

The component calls `createNight()` and redirects the user to the newly created night.

### 5.6 JoinNightPage.jsx

**Purpose:** Join an existing movie night.

Responsibilities:

- Collect a six-character invitation code.
- Normalize the code to uppercase.
- Submit the code through `joinNight()`.
- Display errors when joining is unsuccessful.

### 5.7 NightRoomPage.jsx

**Purpose:** Main collaborative movie-night interface.

Responsibilities:

- Retrieve room information, members and suggestions.
- Display the host and other participants.
- Search for movies through Express.
- Retrieve movie details and runtime before suggesting a movie.
- Add and remove suggestions.
- Display voting progress.
- Allow the host to close voting when backend rules permit it.
- Display a custom confirmation dialog before finalizing voting.
- Allow the host to confirm or cancel finalization.
- Refresh room information periodically.

The room refreshes its data every 15 seconds rather than relying on WebSockets.

### Close Voting Confirmation

The Night Room uses a native HTML `<dialog>` element with
custom CSS styling rather than the browser's default
`window.confirm()` popup.

The host must explicitly confirm the action before the
frontend calls `closeNightVoting()`.

Cancelling the dialog leaves the movie night unchanged.

Important API functions:

- `getNight()`
- `searchNightMovies()`
- `getNightMovie()`
- `addNightSuggestion()`
- `removeNightSuggestion()`
- `closeNightVoting()`

The backend independently validates suggestions, runtime restrictions, membership and host permissions.

### 5.8 VotePage.jsx

**Purpose:** Allow each member to submit or update a ballot.

Responsibilities:

- Retrieve available movie suggestions.
- Allow the user to rank three distinct movies.
- Allow one optional veto outside the ranked selections.
- Validate the selections before submission.
- Save the ballot through `saveNightBallot()`.
- Display success and error messages.

The ballot is stored in MongoDB through Express.

Users can update their ballots while voting remains open, subject to backend rules.

### 5.9 ResultsPage.jsx

**Purpose:** Display the official outcome of a completed movie night.

Responsibilities:

- Retrieve night information and the official result.
- Display the winning movie.
- Display runners-up and excluded movies.
- Show points, ratings and explanations.
- Display the number of submitted ballots.
- Provide navigation back to the Night Room.

The result is calculated by the backend. React only presents the returned information.

Results are displayed as final once the host has closed voting.

### 5.10 WatchlistPage.jsx

**Purpose:** Manage the authenticated user's personal watchlist.

Responsibilities:

- Display saved movies.
- Filter watched and unwatched movies.
- Display watched and unwatched counts.
- Mark movies as watched or not watched.
- Remove movies from the watchlist.
- Navigate to movie details.

Watchlist records are persisted in MongoDB and belong to individual users.

### 5.11 HistoryPage.jsx

**Purpose:** Display previously completed movie nights.

Responsibilities:

- Retrieve the user's nights.
- Identify closed nights.
- Retrieve their official results.
- Display winning movies and voting information.
- Search by night title or winning movie.
- Sort completed nights by date.

History is derived from the user's closed movie nights and their corresponding result endpoints.

## 6. Reusable components

Reusable components are stored in `client/src/components/`.

| Component | File | Responsibility |
|---|---|---|
| Navbar | `NavBar.jsx` | Main navigation, authenticated user information and logout |
| SearchBar | `SearchBar.jsx` | Controlled movie search input and submission |
| MovieCard | `MovieCard.jsx` | Displays an individual movie poster, title, year and rating |
| MovieList | `MovieList.jsx` | Renders collections of MovieCard components |
| NightCard | `NightCard.jsx` | Displays movie-night information and membership status |
| WhereToWatch | `WhereToWatch.jsx` | Displays country-specific streaming and rental providers |
| LoadingIndicator | `LoadingIndicator.jsx` | Reusable animated loading feedback |

### Component relationships

**MovieList → MovieCard**

MovieList receives an array of movies and renders an individual MovieCard for each movie.

**MovieDetailsPage → WhereToWatch**

WhereToWatch receives the selected movie ID and retrieves its available providers.

**App → Navbar**

App supplies the authenticated user and logout handler to Navbar.

**NightsPage → NightCard**

NightsPage renders each movie night through the reusable NightCard component.

## 7. Authentication and global state

### 7.1 AuthContext.jsx

`AuthContext` provides authentication information and functions throughout the React application.

It is initialized in `main.jsx` through:

```jsx
<AuthProvider>
    <App />
</AuthProvider>
```

The provider manages:

- `currentUser`
- `token`
- `authLoading`
- `authError`
- `login()`
- `signup()`
- `logout()`

### 7.2 useAuth.js

Exports the custom `useAuth()` hook.

Components use this hook to access the authentication context without importing or managing the context directly.

Example:

```javascript
const { currentUser, login, logout } = useAuth();
```

The hook also checks that it is used within an `AuthProvider`.

### 7.3 Session restoration

When the application starts:

1. AuthContext checks whether a JWT exists in localStorage.
2. If a token exists, it sends an authenticated request to `/api/auth/me`.
3. Express verifies the token and returns the user.
4. React restores the authenticated state.
5. If the token is expired or invalid, the session is cleared.

The token is stored using the key:

```javascript
movieNightToken
```

Logging out removes the token and clears the current user.

The frontend also listens for authentication expiration events and browser storage changes.

**Important:** The JWT is currently stored in localStorage and sent through the `Authorization: Bearer` header. The backend remains responsible for validating it on protected routes.

### 7.4 Route protection

`App.jsx` checks `currentUser` before displaying protected pages.

Unauthenticated users attempting to access protected routes are redirected to `/login`.

These frontend checks improve navigation and user experience. Actual access control and authorization are enforced by Express.

### 7.5 Watchlist state

`App.jsx` maintains the currently authenticated user's watchlist.

When the user logs in:

1. The frontend retrieves the watchlist from Express.
2. The returned items are stored in React state.
3. Components receive the relevant watchlist data and callbacks.
4. Add, remove and watched-status operations update MongoDB through the API.
5. The local React state is updated using the backend response.

The watchlist is associated with the authenticated user's ID to prevent displaying one user's records to another.

## 8. Frontend API layer

API modules are located in:

```text
client/src/api/
```

They separate HTTP communication from React components.

### 8.1 backend.js

The central API helper.

Main responsibilities:

- Build backend request URLs.
- Add the `/api` prefix.
- Retrieve the stored JWT for authenticated requests.
- Attach the `Authorization` header.
- Serialize JSON request bodies.
- Handle HTTP errors.
- Handle empty `204 No Content` responses.
- Detect authentication expiration.
- Support request cancellation through AbortController signals.

The main exported function is:

```javascript
apiRequest(path, options)
```

By default, requests are authenticated. Public endpoints explicitly use:

```javascript
{ authenticated: false }
```

### 8.2 movies.js

Handles all movie-data requests through Express.

Main functions:

| Function | Responsibility |
|---|---|
| `getPopularMovies()` | Retrieve popular movies |
| `searchMovies()` | Search movies for Discover |
| `getMovieDetails()` | Retrieve complete movie information |
| `getWatchProviders()` | Retrieve country-specific viewing providers |
| `searchNightMovies()` | Search movies within a Night Room |
| `getNightMovie()` | Retrieve movie details for runtime verification |

Movie API requests are public and do not require user authentication.

The module uses `apiRequest()` rather than making direct authenticated requests to TMDB.

### 8.3 nights.js

Handles movie-night operations.

Main functions:

- `getMyNights()`
- `createNight()`
- `joinNight()`
- `getNight()`
- `addNightSuggestion()`
- `removeNightSuggestion()`
- `saveNightBallot()`
- `closeNightVoting()`
- `getNightResult()`

These requests require an authenticated user.

### 8.4 watchlist.js

Handles personal watchlist operations.

Main functions:

- `getWatchlist()`
- `addToWatchlist()`
- `setWatchlistWatched()`
- `removeFromWatchlist()`

All operations communicate with Express and are associated with the authenticated user.

### 8.5 tmdbImages.js

Contains public TMDB image URL constants:

```javascript
export const IMAGE_BASE_URL =
    "https://image.tmdb.org/t/p/w500";

export const BACKDROP_BASE_URL =
    "https://image.tmdb.org/t/p/w1280";
```

These constants are used to construct poster, backdrop and provider-logo image URLs.

They do not contain API credentials and do not make API requests.

### 8.6 API request examples

The frontend communicates with the following movie endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/movies/popular?page=` | Popular movies |
| GET | `/api/movies/search?query=&page=` | Movie search |
| GET | `/api/movies/:tmdbId` | Movie details |
| GET | `/api/movies/:tmdbId/providers` | Viewing providers |

The frontend also communicates with authentication, nights, memberships, ballots, results and watchlist endpoints.

For the complete endpoint list and request formats, refer to the root README.

## 9. Movie data and TMDB integration

TMDB is the external movie information provider.

The frontend uses it for:

- Popular movies.
- Movie search.
- Movie details.
- Runtime information.
- Streaming and rental availability.
- Movie posters and backdrops.
- Provider logos.

### Request flow

For movie information:

1. A React page calls a function from `movies.js`.
2. The function uses `apiRequest()` to send a request to Express.
3. Express calls the TMDB service using its private token.
4. TMDB returns the requested information.
5. Express normalizes the response and returns JSON.
6. React updates its state and renders the information.

The TMDB Read Access Token is configured exclusively on the backend,
through `server/.env` during local development and Render environment
variables in production.

It must never be included in frontend environment variables or browser requests.

### Movie image handling

Image URLs are constructed using the constants exported by `tmdbImages.js`.

For example:

```javascript
const posterUrl = IMAGE_BASE_URL + movie.posterPath;
```

These public image requests are allowed to go directly to TMDB's image server because they do not require the private API token.

## 10. Application state and business rules

React manages interface-related state such as:

- Current search results.
- Loading and error messages.
- Form inputs.
- Selected filters.
- Temporary display information.
- The currently loaded movie-night information.

Persistent application records are managed by the backend.

### Important distinction: frontend versus backend responsibilities

| Operation | Frontend responsibility | Backend responsibility |
|---|---|---|
| Authentication | Collect credentials and maintain session state | Verify credentials and issue JWT |
| Movie discovery | Display results and handle searches | Retrieve data from TMDB |
| Suggestions | Collect and display suggestions | Validate runtime, membership and duplicates |
| Voting | Collect rankings and veto selection | Validate and persist ballots |
| Finalization | Provide host controls | Enforce permissions and close voting |
| Results | Display winner and explanations | Calculate official results |
| Watchlist | Display and update interface state | Persist user-specific records |
| History | Display completed nights | Retrieve persisted nights and results |

### Voting rules

The frontend provides the controls for:

- Three distinct ranked movie selections.
- First choice: 3 points.
- Second choice: 2 points.
- Third choice: 1 point.
- One optional veto outside the ranked selections.

The backend validates ballots and calculates the official result.

The scoring process excludes movies that violate the runtime cap or are vetoed. Remaining movies are ranked by points, with TMDB rating and title used as tie-breakers.

The frontend does not independently calculate the official winner.

## 11. Performance, navigation and user experience

### Code splitting

`App.jsx` uses React `lazy()` and `Suspense` to load most page components when needed.

Discover is loaded directly, while pages such as Movie Details, Night Room, Voting, Results and Watchlist are lazy-loaded.

The reusable LoadingIndicator is used as a fallback while pages load.

### Loading and error handling

Pages maintain loading and error states using React hooks.

The LoadingIndicator component displays animated loading feedback.

API errors are caught and presented through the relevant page or component.

### Movie images

MovieCard uses lazy loading for ordinary movie posters and supports eager loading for priority images.

Movie Details prioritizes its large backdrop image and uses a loading state for its reveal animation.

### Navigation

React Router handles navigation without full-page reloads.

Movie cards can preserve the originating page through navigation state. This allows users to return to the Night Room, Results, Watchlist or other relevant page after viewing movie details.

### Responsive design

The application styling is maintained through:

- `App.css`
- `index.css`

These files define the application's layout, movie cards, forms, navigation, responsive behavior, loading animations and visual states.

## 12. Testing and quality checks

The frontend uses:

- **Vitest** for executing automated tests.
- **React Testing Library** for rendering components and testing interactions.
- **jsdom** for providing a simulated browser environment.
- **oxlint** for static code analysis.

Tests are located alongside their relevant components and pages.

Current test files include:

| Test file | Main purpose |
|---|---|
| `SearchBar.test.jsx` | Search input and submission |
| `NightCard.test.jsx` | Movie-night card rendering |
| `NightRoomPage.test.jsx` | Room behavior, suggestions, host permissions,voting finalization and confirmation dialog interactions |
| `VotePage.test.jsx` | Ballot selection and submission |
| `ResultsPage.test.jsx` | Results rendering |
| `WatchlistPage.test.jsx` | Watchlist interactions |
| `HistoryPage.test.jsx` | Completed-night history |

Native dialog methods are simulated in `setupTests.js` when
they are unavailable in jsdom.

The Night Room tests verify that voting is finalized only
after explicit confirmation and that cancelling the dialog
does not trigger the backend operation.

Frontend tests mock API functions and therefore do not require a running Express server, MongoDB database or live TMDB connection.

### Run the tests

From the project root:

```bash
npm --prefix client test
```

### Run lint

```bash
npm --prefix client run lint
```

### Create a production build

```bash
npm --prefix client run build
```

### Preview the production build

```bash
cd client
npm run preview
```

A successful build confirms that Vite can compile the frontend. It does not independently verify that the backend or database is available.

## 13. Frontend folder structure

The following is the intended frontend structure after the TMDB migration:

```text
client/
│
├── public/
│
├── src/
│   │
│   ├── api/
│   │   ├── backend.js
│   │   ├── movies.js
│   │   ├── nights.js
│   │   ├── watchlist.js
│   │   └── tmdbImages.js
│   │
│   ├── auth/
│   │   ├── AuthContext.jsx
│   │   └── useAuth.js
│   │
│   ├── components/
│   │   ├── LoadingIndicator.jsx
│   │   ├── MovieCard.jsx
│   │   ├── MovieList.jsx
│   │   ├── NavBar.jsx
│   │   ├── NightCard.jsx
│   │   ├── SearchBar.jsx
│   │   └── WhereToWatch.jsx
│   │
│   ├── pages/
│   │   ├── CreateNightPage.jsx
│   │   ├── DiscoverPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── JoinNightPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MovieDetailsPage.jsx
│   │   ├── NightRoomPage.jsx
│   │   ├── NightsPage.jsx
│   │   ├── ResultsPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── VotePage.jsx
│   │   └── WatchlistPage.jsx
│   │
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── popcorn.png
│   └── setupTests.js
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json
├── .env.example
└── README_Frontend.md
```

Individual `.test.jsx` files are also maintained alongside the components and pages they test.

### Important file responsibilities

| File | Responsibility |
|---|---|
| `main.jsx` | Initializes React and wraps the application in AuthProvider |
| `App.jsx` | Defines routes, page access, lazy loading and global watchlist handlers |
| `AuthContext.jsx` | Authentication state and session management |
| `useAuth.js` | Custom hook for accessing authentication context |
| `backend.js` | Central HTTP communication helper |
| `movies.js` | Movie API functions |
| `nights.js` | Movie-night API functions |
| `watchlist.js` | Watchlist API functions |
| `tmdbImages.js` | Public TMDB image URL constants |
| `index.css` | Global styling |
| `App.css` | Application-specific styling |
| `vite.config.js` | Vite development server, API proxy and Vitest configuration |
| `setupTests.js` | Frontend test setup, jest-dom matchers and native dialog compatibility |
| `vercel.json` | Production SPA rewrite configuration for React Router navigation and page refreshes |


## 14. Production Deployment

The Movie Night frontend is deployed on Vercel.

- **Live Application:** https://movienight-alpha.vercel.app
- **Backend API:** https://movienight-api.onrender.com

### Vercel Configuration

- Production branch: `main`
- Root directory: `client`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

### API Communication

The frontend uses the `VITE_API_URL` environment variable
to communicate with the deployed Express backend.

During local development, this variable can remain empty,
allowing API requests to pass through the Vite development
proxy.

In production, API requests are sent directly to the
Render backend over HTTPS.

Private TMDB credentials, MongoDB credentials and JWT
signing secrets are never included in the frontend bundle.

### Client-Side Routing

The `vercel.json` rewrite configuration ensures that
React Router handles direct navigation and browser
refreshes without hosting-related 404 errors.

### Data Persistence

All persistent application data is managed by the Express
backend and stored in MongoDB Atlas.

## 15. Known Limitations

The application uses periodic room refreshes rather than WebSocket-based communication.

Movie provider availability depends on the information supplied by TMDB and may vary by country.

The application requires a functioning backend connection for authenticated and persistent features.

The Render free-tier backend may require a cold start
after a period of inactivity.

## 16. Related Documentation

For further project information, consult:

- [`../README.md`](../README.md) — Complete project overview, setup, backend API, architecture and testing instructions.
- [`../docs/schema.md`](../docs/schema.md) — MongoDB collections, fields, relationships and backend-enforced rules.

---

**Movie Night — Frontend Documentation**

React 19 · Vite · React Router · Express API Integration · MongoDB Persistence