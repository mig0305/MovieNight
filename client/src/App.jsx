import { useState } from "react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import DiscoverPage from "./pages/DiscoverPage";

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

import { calculateNightResults } from "./utils/calculateResults";

import LoadingIndicator from "./components/LoadingIndicator";


function App() {

    // Frontend-only authentication preview
    const [currentUser, setCurrentUser] = useState(null);
    function handleAuthSuccess(user) {
        setCurrentUser(user);
    }

    function handleLogout() {
        setCurrentUser(null);
    }

    // Temporary frontend-only storage for movie nights
    const [nights, setNights] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [votes, setVotes] = useState([]);
    const [watchlist, setWatchlist] = useState([]);

    // Create a new movie night
    function handleCreateNight({ title, maxRuntimeMin }) {

        // Generate a unique 6-character join code
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code;

        do {
            code = "";

            for (let i = 0; i < 6; i++) {
                const index = Math.floor(
                    Math.random() * characters.length
                );

                code += characters[index];
            }
        } while (nights.some((night) => night.joinCode === code));

        const newNight = {
            id: String(Date.now()),
            title: title,
            maxRuntimeMin: maxRuntimeMin,
            joinCode: code,
            ownerEmail: currentUser.email,
            memberEmails: [currentUser.email],
            status: "active",
            createdAt: new Date().toISOString()
        };

        setNights([...nights, newNight]);
    }

    // Join an existing movie night
    function handleJoinNight(code) {

        const night = nights.find(
            (night) => night.joinCode === code
        );

        if (!night) {
            return {
                success: false,
                message: "No movie night found with this code."
            };
        }

        if (night.status !== "active") {
            return {
                success: false,
                message: "This movie night is already completed."
            };
        }

        if (night.memberEmails.includes(currentUser.email)) {
            return {
                success: false,
                message: "You are already a member of this night."
            };
        }

        const updatedNights = nights.map((n) => {

            if (n.id === night.id) {
                return {
                    ...n,
                    memberEmails: [
                        ...n.memberEmails,
                        currentUser.email
                    ]
                };
            }

            return n;
        });

        setNights(updatedNights);

        return {
            success: true,
            message: "Successfully joined the movie night."
        };
    }

    function handleAddSuggestion(nightId, movie) {

        const night = nights.find((n) => n.id === nightId);

        // Check that the night exists and is active
        if (!night || night.status !== "active") {
            return {
                success: false,
                message: "This movie night is not available."
            };
        }

        // Check group membership
        if (
            !currentUser ||
            !night.memberEmails.includes(currentUser.email)
        ) {
            return {
                success: false,
                message: "You are not a member of this night."
            };
        }

        // Check that TMDB provided a valid runtime
        if (!Number.isInteger(movie.runtime) || movie.runtime <= 0) {
            return {
                success: false,
                message: "This movie has no valid runtime on TMDB."
            };
        }

        // Enforce the maximum runtime
        if (movie.runtime > night.maxRuntimeMin) {
            return {
                success: false,
                message: `${movie.title} is ${movie.runtime} minutes long.
                        The limit is ${night.maxRuntimeMin} minutes.`
            };
        }

        // Prevent the same film being suggested twice
        const duplicate = suggestions.some(
            (s) =>
                s.nightId === nightId &&
                s.tmdbId === movie.id
        );

        if (duplicate) {
            return {
                success: false,
                message: "This movie has already been suggested."
            };
        }

        // Create the suggestion
        const newSuggestion = {
            id: `${nightId}-${movie.id}`,
            nightId: nightId,
            tmdbId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
            runtime: movie.runtime,
            voteAverage: movie.vote_average,
            addedByEmail: currentUser.email
        };

        // Update React state
        setSuggestions([...suggestions, newSuggestion]);

        return {
            success: true,
            message: `${movie.title} was added successfully!`
        };
    }

    function handleRemoveSuggestion(nightId, suggestionId) {

        const night = nights.find((n) => n.id === nightId);

        if (!night || night.status !== "active") {
            return {
                success: false,
                message: "This movie night cannot be modified."
            };
        }

        if (
            !currentUser ||
            !night.memberEmails.includes(currentUser.email)
        ) {
            return {
                success: false,
                message: "You are not a member of this night."
            };
        }

        const suggestion = suggestions.find(
            (s) =>
                s.id === suggestionId &&
                s.nightId === nightId
        );

        if (!suggestion) {
            return {
                success: false,
                message: "Suggestion not found."
            };
        }

        // Only the original contributor can remove it
        if (suggestion.addedByEmail !== currentUser.email) {
            return {
                success: false,
                message: "You can only remove your own suggestions."
            };
        }

        const updatedSuggestions = suggestions.filter(
            (s) => s.id !== suggestionId
        );

        setSuggestions(updatedSuggestions);

        // Invalidate ballots referencing the removed movie
        setVotes(
            votes.filter(
                (vote) =>
                    !(
                        vote.nightId === nightId &&
                        (
                            vote.rankedIds.includes(suggestionId) ||
                            vote.vetoId === suggestionId
                        )
                    )
            )
        );

        return {
            success: true,
            message: "Movie suggestion removed."
        };
    }

    function handleSaveVote(nightId, rankedIds, vetoId) {

        const night = nights.find((n) => n.id === nightId);

        // Check that the night exists and is active
        if (!night || night.status !== "active") {
            return {
                success: false,
                message: "Voting is not available for this night."
            };
        }

        // Check membership
        if (
            !currentUser ||
            !night.memberEmails.includes(currentUser.email)
        ) {
            return {
                success: false,
                message: "You are not a member of this night."
            };
        }

        // Find the movies suggested for this night
        const nightSuggestions = suggestions.filter(
            (s) => s.nightId === nightId
        );

        if (nightSuggestions.length < 3) {
            return {
                success: false,
                message: "At least three movies are required."
            };
        }

        // Check that all three ranks contain valid suggestions
        const validIds = nightSuggestions.map((s) => s.id);

        if (
            !Array.isArray(rankedIds) ||
            rankedIds.length !== 3 ||
            !rankedIds.every((id) => validIds.includes(id))
        ) {
            return {
                success: false,
                message: "Please select three valid movies."
            };
        }

        // Prevent ranking the same movie twice
        if (new Set(rankedIds).size !== 3) {
            return {
                success: false,
                message: "Each ranked movie must be different."
            };
        }

        // Verify the optional veto
        if (vetoId) {

            if (!validIds.includes(vetoId)) {
                return {
                    success: false,
                    message: "Invalid veto selection."
                };
            }

            if (rankedIds.includes(vetoId)) {
                return {
                    success: false,
                    message: "You cannot veto one of your top three."
                };
            }
        }

        // Construct this user's ballot
        const newVote = {
            nightId: nightId,
            userEmail: currentUser.email,
            rankedIds: rankedIds,
            vetoId: vetoId || null
        };

        // Replace an existing ballot, or add a new one
        const otherVotes = votes.filter(
            (v) =>
                !(
                    v.nightId === nightId &&
                    v.userEmail === currentUser.email
                )
        );

        setVotes([...otherVotes, newVote]);

        return {
            success: true,
            message: "Your vote was saved successfully!"
        };
    }

    function handleFinalizeNight(nightId) {

        const night = nights.find((n) => n.id === nightId);

        // Verify the night exists and is active
        if (!night || night.status !== "active") {
            return {
                success: false,
                message: "This movie night cannot be finalized."
            };
        }

        // Only the host can close voting
        if (
            !currentUser ||
            night.ownerEmail !== currentUser.email
        ) {
            return {
                success: false,
                message: "Only the host can close voting."
            };
        }

        const nightSuggestions = suggestions.filter(
            (s) => s.nightId === nightId
        );

        if (nightSuggestions.length < 3) {
            return {
                success: false,
                message: "At least three movies are required."
            };
        }

        // Count votes from current group members
        const nightVotes = votes.filter(
            (v) =>
                v.nightId === nightId &&
                night.memberEmails.includes(v.userEmail)
        );

        if (nightVotes.length !== night.memberEmails.length) {
            return {
                success: false,
                message: "All group members must vote before closing."
            };
        }

        // Calculate the final result
        const result = calculateNightResults(
            night,
            suggestions,
            votes
        );

        // Every movie might have been excluded
        if (!result.winner) {
            return {
                success: false,
                message:
                    "No eligible movie remains. Members must " +
                    "update their vetoes or suggestions."
            };
        }

        // Mark the night completed and save the result
        const updatedNights = nights.map((n) => {

            if (n.id === nightId) {
                return {
                    ...n,
                    status: "completed",
                    finalizedAt: new Date().toISOString(),
                    result: result
                };
            }

            return n;
        });

        setNights(updatedNights);

        return {
            success: true,
            message: "Voting closed successfully!"
        };
    }

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

    return (
        <BrowserRouter>
            <div className="whole-app">

                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>

                <Navbar
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
              
                <main
                    id="main-content"
                    className="app-content"
                    tabIndex={-1}
                >
                <Suspense fallback={<LoadingIndicator text="Opening page..." />}>
                    <Routes>

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
                                    : <LoginPage
                                        onAuthSuccess={handleAuthSuccess}
                                      />
                            }
                        />

                        <Route
                            path="/signup"
                            element={
                                currentUser
                                    ? <Navigate to="/" replace />
                                    : <SignupPage
                                        onAuthSuccess={handleAuthSuccess}
                                      />
                            }
                        />
                        
                        <Route
                            path="/nights"
                            element={
                                currentUser ? (
                                    <NightsPage
                                        nights={nights}
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
                                    <CreateNightPage
                                        onCreateNight={handleCreateNight}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/join"
                            element={
                                currentUser ? (
                                    <JoinNightPage
                                        onJoinNight={handleJoinNight}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/:id/vote"
                            element={
                                currentUser ? (
                                    <VotePage
                                        nights={nights}
                                        suggestions={suggestions}
                                        votes={votes}
                                        currentUser={currentUser}
                                        onSaveVote={handleSaveVote}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/:id"
                            element={
                                currentUser ? (
                                    <NightRoomPage
                                        nights={nights}
                                        suggestions={suggestions}
                                        votes={votes}
                                        currentUser={currentUser}
                                        onAddSuggestion={handleAddSuggestion}
                                        onRemoveSuggestion={handleRemoveSuggestion}
                                        onFinalizeNight={handleFinalizeNight}
                                    />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />

                        <Route
                            path="/nights/:id/results"
                            element={
                                currentUser ? (
                                    <ResultsPage
                                        nights={nights}
                                        currentUser={currentUser}
                                    />
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
