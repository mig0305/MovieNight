import { useEffect, useState } from "react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { Navbar } from "./components/NavBar";
import DiscoverPage from "./pages/DiscoverPage";
import ConnectionTestPage from "./pages/ConnectionTestPage";
import { useAuth } from "./auth/useAuth";
import {
    getWatchlist,
    addToWatchlist,
    setWatchlistWatched,
    removeFromWatchlist
} from "./api/watchlist";

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
    // The logged-in user's watchlist, loaded from MongoDB.
    // We remember whose list it is, so a different user never sees it.
    const userId = currentUser?.id ?? null;

    const [savedWatchlist, setSavedWatchlist] = useState({
        userId: null,
        items: []
    });
    const [watchlistError, setWatchlistError] = useState("");

    const watchlist =
        userId && savedWatchlist.userId === userId
            ? savedWatchlist.items
            : [];

    // Load the watchlist after login (and again if the user changes)
    useEffect(() => {
        if (!userId) return;

        const controller = new AbortController();

        getWatchlist({ signal: controller.signal })
            .then((items) => {
                setSavedWatchlist({ userId, items });
                setWatchlistError("");
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    setWatchlistError(error.message);
                }
            });

        return () => controller.abort();
    }, [userId]);

    function updateWatchlistItems(change) {
        setSavedWatchlist((current) => ({
            ...current,
            items: change(current.items)
        }));
    }

    async function handleAddToWatchlist(movie) {
        if (!userId) return;

        setWatchlistError("");

        try {
            const item = await addToWatchlist(movie.id);

            updateWatchlistItems((items) => [
                item,
                ...items.filter((i) => i.tmdbId !== item.tmdbId)
            ]);
        } catch (error) {
            setWatchlistError(error.message);
        }
    }

    async function handleRemoveFromWatchlist(tmdbId) {
        if (!userId) return;

        setWatchlistError("");

        try {
            await removeFromWatchlist(tmdbId);

            updateWatchlistItems((items) =>
                items.filter((i) => i.tmdbId !== Number(tmdbId))
            );
        } catch (error) {
            setWatchlistError(error.message);
        }
    }

    async function handleToggleWatched(tmdbId) {
        const item = watchlist.find(
            (i) => i.tmdbId === Number(tmdbId)
        );

        if (!item) return;

        setWatchlistError("");

        try {
            const updated = await setWatchlistWatched(
                item.tmdbId,
                !item.watched
            );

            updateWatchlistItems((items) =>
                items.map((i) =>
                    i.tmdbId === updated.tmdbId ? updated : i
                )
            );
        } catch (error) {
            setWatchlistError(error.message);
        }
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
                                    watchlistError={watchlistError}
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
                                        watchlistError={watchlistError}
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
                                    <HistoryPage />
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