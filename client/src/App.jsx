import { useState } from "react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { Navbar } from "./components/NavBar";
import DiscoverPage from "./pages/DiscoverPage";
import ConnectionTestPage from "./pages/ConnectionTestPage";
import { useAuth } from "./auth/useAuth";

const MovieDetailsPage = lazy(() =>
    import("./pages/MovieDetailsPage")
);

const SignupPage = lazy(() =>
    import("./pages/SignupPage")
);

const LoginPage = lazy(() =>
    import("./pages/LoginPage")
);

const NightsPage = lazy(() =>
    import("./pages/NightsPage")
);

const CreateNightPage = lazy(() =>
    import("./pages/CreateNightPage")
);

const JoinNightPage = lazy(() =>
    import("./pages/JoinNightPage")
);

const NightRoomPage = lazy(() =>
    import("./pages/NightRoomPage")
);

const VotePage = lazy(() =>
    import("./pages/VotePage")
);

const ResultsPage = lazy(() =>
    import("./pages/ResultsPage")
);

const WatchlistPage = lazy(() =>
    import("./pages/WatchlistPage")
);

const HistoryPage = lazy(() =>
    import("./pages/HistoryPage")
);

import LoadingIndicator from "./components/LoadingIndicator";

function App() {
    
    const {
        currentUser,
        authLoading,
        authError,
        logout
    } = useAuth();
    // Temporary frontend-only storage for movie nights
    const [nights] = useState([]);
    const [watchlist, setWatchlist] = useState([]);

    function handleAddToWatchlist(movie) {

        if (!currentUser) return;

        // Prevent duplicates in the current user's watchlist
        const alreadySaved = watchlist.some(
            (item) =>
                item.userEmail === currentUser.email &&
                item.tmdbId === Number(movie.id)
        );

        if (alreadySaved) return;

        const newItem = {
            userEmail: currentUser.email,
            tmdbId: Number(movie.id),
            title: movie.title,
            posterPath: movie.poster_path || null,
            releaseDate: movie.release_date || "",
            runtime: movie.runtime || null,
            voteAverage: movie.vote_average || 0,
            watched: false,
            addedAt: new Date().toISOString(),
            watchedAt: null
        };

        setWatchlist([...watchlist, newItem]);
    }

    function handleRemoveFromWatchlist(tmdbId) {

        if (!currentUser) return;

        const updatedWatchlist = watchlist.filter(
            (item) =>
                !(
                    item.userEmail === currentUser.email &&
                    item.tmdbId === Number(tmdbId)
                )
        );

        setWatchlist(updatedWatchlist);
    }

    function handleToggleWatched(tmdbId) {

        if (!currentUser) return;

        const updatedWatchlist = watchlist.map((item) => {

            if (
                item.userEmail === currentUser.email &&
                item.tmdbId === Number(tmdbId)
            ) {
                const nowWatched = !item.watched;

                return {
                    ...item,
                    watched: nowWatched,
                    watchedAt: nowWatched
                        ? new Date().toISOString()
                        : null
                };
            }

            return item;
        });

        setWatchlist(updatedWatchlist);
    }
    if (authLoading) {
        return (
            <LoadingIndicator text="Checking your session..." />
        );
    }

    if (authError) {
        return (
            <section className="auth-page">
                <div className="auth-card">
                    <h1>Session verification unavailable</h1>

                    <p className="auth-error" role="alert">
                        {authError}
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                    >
                        Return to signed-out mode
                    </button>
                </div>
            </section>
        );
    }

    return (
        <BrowserRouter>
            <div className="whole-app">

                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>

                <Navbar
                    currentUser={currentUser}
                    onLogout={logout}
                />
              
                <main
                    id="main-content"
                    className="app-content"
                    tabIndex={-1}
                >
                <Suspense fallback={<LoadingIndicator text="Opening page..." />}>
                    <Routes>
                        <Route
                            path="/connection-test"
                            element={<ConnectionTestPage />}
                        />

                        <Route
                            path="/"
                            element={<DiscoverPage />}
                        />
                        
                        <Route
                            path="/movie/:id"
                            element={
                                <MovieDetailsPage
                                    currentUser={currentUser}
                                    watchlist={watchlist}
                                    onAddToWatchlist={handleAddToWatchlist}
                                    onRemoveFromWatchlist={handleRemoveFromWatchlist}
                                    onToggleWatched={handleToggleWatched}
                                />
                            }
                        />

                        <Route
                            path="/login"
                            element={
                                currentUser
                                    ? <Navigate to="/" replace />
                                    : <LoginPage />
                            }
                        />

                        <Route
                            path="/signup"
                            element={
                                currentUser
                                    ? <Navigate to="/" replace />
                                    : <SignupPage />
                            }
                        />
                        
                        <Route
                            path="/nights"
                            element={
                                currentUser ? (
                                    <NightsPage
                                        currentUser={currentUser}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/new"
                            element={
                                currentUser ? (
                                    <CreateNightPage/>
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/join"
                            element={
                                currentUser ? (
                                    <JoinNightPage/>
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                  
                        <Route
                            path="/nights/:id/vote"
                            element={
                                currentUser ? (
                                    <VotePage />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/:id"
                            element={
                                currentUser ? (
                                    <NightRoomPage />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/:id/results"
                            element={
                                currentUser ? (
                                    <ResultsPage />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/watchlist"
                            element={
                                currentUser ? (
                                    <WatchlistPage
                                        watchlist={watchlist}
                                        currentUser={currentUser}
                                        onRemoveFromWatchlist={
                                            handleRemoveFromWatchlist
                                        }
                                        onToggleWatched={handleToggleWatched}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/history"
                            element={
                                currentUser ? (
                                    <HistoryPage
                                        nights={nights}
                                        currentUser={currentUser}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="*"
                            element={
                                <div className="not-found">
                                    <h1>404 - Page Not Found</h1>
                                    <Link to="/">
                                        Back to Discover
                                    </Link>
                                </div>
                            }
                        />

                    </Routes>
                </Suspense>
                </main>

                <footer className="app-footer">
                    <p>Movie data provided by TMDB.</p>
                </footer>

            </div>
        </BrowserRouter>
    );
}

export default App;
