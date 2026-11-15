import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { SearchBar } from "../components/SearchBar";
import { MovieCard } from "../components/MovieCard";
import LoadingIndicator from "../components/LoadingIndicator";


import { searchMovies, getMovieDetails, IMAGE_BASE_URL } from "../api/tmdb";


export default function NightRoomPage({
    nights,
    suggestions,
    votes,
    currentUser,
    onAddSuggestion,
    onRemoveSuggestion,
    onFinalizeNight
}) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [closeError, setCloseError] = useState("");
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [addingId, setAddingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageIsError, setMessageIsError] = useState(false);

    // Find this movie night
    const night = nights.find((n) => n.id === id);

    // Find suggestions belonging to this night
    const nightSuggestions = suggestions.filter((s) => s.nightId === id);

    const nightVotes = votes.filter(
        (v) => v.nightId === id
    );

    const votingPercentage = night
        ? Math.round(
            (nightVotes.length / night.memberEmails.length) * 100
        )
        : 0;


    const hasVoted = nightVotes.some(
        (v) => v.userEmail === currentUser.email
    );

    // Search TMDB
    async function handleSearch(query) {
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setSearchError("");
        setMovies([]);

        try {
            const results = await searchMovies(query.trim());
            setMovies(results);
        } catch {
            setSearchError("Could not search for movies.");
        } finally {
            setLoading(false);
        }
    }

    // Fetch full details before suggesting a movie
    async function handleSuggest(movie) {
        setAddingId(movie.id);
        setMessage("");

        try {
            const details = await getMovieDetails(movie.id);

            const result = onAddSuggestion(id, details);

            setMessage(result.message);
            setMessageIsError(!result.success);
        } catch {
            setMessage("Could not load movie details.");
            setMessageIsError(true);
        } finally {
            setAddingId(null);
        }
    }

    // Remove one of your own suggestions
    function handleRemove(suggestionId) {
        const result = onRemoveSuggestion(id, suggestionId);

        setMessage(result.message);
        setMessageIsError(!result.success);
    }

    // Invalid night
    if (!night) {
        return (
            <section className="night-room-page">
                <h1>Movie night not found</h1>
                <Link to="/nights" className="back-link">
                    Back to My Nights
                </Link>
            </section>
        );
    }

    // Membership check
    if (!night.memberEmails.includes(currentUser.email)) {
        return (
            <section className="night-room-page">
                <h1>Access denied</h1>
                <p>You are not a member of this movie night.</p>
                <Link to="/nights" className="back-link">
                    Back to My Nights
                </Link>
            </section>
        );
    }

    function handleCloseVoting() {

        const result = onFinalizeNight(id);

        if (!result.success) {
            setCloseError(result.message);
            return;
        }

        navigate(`/nights/${id}/results`);
    }

    return (
        <section className="night-room-page">

            <Link to="/nights" className="back-link">
                ← Back to My Nights
            </Link>

            {/* NIGHT INFORMATION */}

            <div className="room-header">
                <div>
                    <h1>{night.title}</h1>
                    <p>
                        {night.ownerEmail === currentUser.email
                            ? "You are hosting this movie night."
                            : "You are a member of this movie night."}
                    </p>
                </div>

                <span className={`night-status ${night.status}`}>
                    {night.status === "active"
                        ? "Active"
                        : "Completed"}
                </span>
            </div>

            <div className="room-stats">
                <div className="room-stat">
                    <span>Maximum runtime</span>
                    <strong>{night.maxRuntimeMin} min</strong>
                </div>

                <div className="room-stat">
                    <span>Members</span>
                    <strong>{night.memberEmails.length}</strong>
                </div>

                <div className="room-stat">
                    <span>Invitation code</span>
                    <strong>{night.joinCode}</strong>
                </div>
            </div>

            {/* GROUP MEMBERS */}

            <div className="room-section">
                <h2>Group Members</h2>

                <div className="room-members">
                    {night.memberEmails.map((email) => (
                        <div className="room-member" key={email}>
                            <span>
                                {email === currentUser.email
                                    ? `${email} (You)`
                                    : email}
                            </span>

                            {email === night.ownerEmail && (
                                <strong>Host</strong>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* GROUP VOTING */}

            <div className="room-section voting-section">
                <h2>Group Voting</h2>

                <p className="room-hint">
                    {nightVotes.length} of {night.memberEmails.length} members
                    have submitted their votes.
                </p>

                <div
                    className="voting-progress"
                    role="progressbar"
                    aria-label="Group voting progress"
                    aria-valuenow={votingPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className="voting-progress-fill"
                        style={{ width: `${votingPercentage}%` }}
                    />
                </div>

                {night.status === "active" && (
                    nightSuggestions.length >= 3 ? (
                        <div className="voting-action">

                            <p>
                                {hasVoted
                                    ? "Your ballot is saved. You can still update it."
                                    : "Rank your top three movies and use your veto."}
                            </p>

                            <Link
                                to={`/nights/${id}/vote`}
                                className="night-button"
                            >
                                {hasVoted
                                    ? "Update My Vote"
                                    : "Cast My Vote"}
                            </Link>

                        </div>
                    ) : (
                        <p className="room-empty">
                            At least three movie suggestions are needed
                            before voting can begin.
                        </p>
                    )
                )}
            </div>

            {/* HOST FINALIZATION CONTROLS */}

            {night.status === "active" &&
                night.ownerEmail === currentUser.email && (

                <div className="room-section finalize-section">

                    <h2>Host Controls</h2>

                    <p className="room-hint">
                        {nightVotes.length} of {night.memberEmails.length}
                        {" "}members have submitted their votes.
                    </p>

                    <p className="room-hint">
                        Closing voting will calculate the winner and
                        permanently finalize this movie night.
                    </p>

                    <button
                        type="button"
                        className="finalize-button"
                        onClick={handleCloseVoting}
                        disabled={
                            nightVotes.length !== night.memberEmails.length ||
                            nightSuggestions.length < 3
                        }
                    >
                        Close Voting & Show Results
                    </button>

                    {closeError && (
                        <p className="room-message error" role="alert">
                            {closeError}
                        </p>
                    )}

                </div>
            )}

            {night.status === "completed" && (
                <div className="room-section completed-room">

                    <h2>Voting Completed</h2>

                    <p>
                        The results have been finalized.
                        See which movie won!
                    </p>

                    <Link
                        to={`/nights/${id}/results`}
                        className="night-button"
                    >
                        View Final Results
                    </Link>

                </div>
            )}



            {/* MOVIE SUGGESTIONS */}

            <div className="room-section">
                <h2>
                    Suggested Movies ({nightSuggestions.length})
                </h2>

                {nightSuggestions.length === 0 ? (
                    <p className="room-empty">
                        No movies suggested yet.
                        Be the first to suggest one!
                    </p>
                ) : (
                    <div className="suggestions-list">
                        {nightSuggestions.map((suggestion) => (
                            <div
                                className="suggestion-card"
                                key={suggestion.id}
                            >
                                <Link to={`/movie/${suggestion.tmdbId}`} state={{ returnTo: `/nights/${id}` }}>
                                    {suggestion.posterPath ? (
                                        <img
                                            src={
                                                IMAGE_BASE_URL +
                                                suggestion.posterPath
                                            }
                                            alt={suggestion.title}
                                        />
                                    ) : (
                                        <div className="suggestion-no-poster">
                                            No poster
                                        </div>
                                    )}
                                </Link>

                                <div className="suggestion-info">
                                    <h3>
                                        <Link to={`/movie/${suggestion.tmdbId}`} state={{ returnTo: `/nights/${id}` }}>
                                            {suggestion.title}
                                        </Link>
                                    </h3>

                                    <p>
                                        Runtime: {suggestion.runtime} min
                                    </p>

                                    <p>
                                        TMDB rating:{" "}
                                        {suggestion.voteAverage.toFixed(1)}/10
                                    </p>

                                    <p>
                                        Suggested by:{" "}
                                        {suggestion.addedByEmail ===
                                        currentUser.email
                                            ? "You"
                                            : suggestion.addedByEmail}
                                    </p>
                                </div>

                                {suggestion.addedByEmail ===
                                    currentUser.email &&
                                    night.status === "active" && (
                                        <button
                                            type="button"
                                            className="remove-suggestion"
                                            onClick={() =>
                                                handleRemove(suggestion.id)
                                            }
                                        >
                                            Remove
                                        </button>
                                    )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SEARCH FOR NEW SUGGESTIONS */}

            {night.status === "active" && (
                <div className="room-section night-search-section">
                    <h2>Suggest a Movie</h2>

                    <p className="room-hint">
                        Search TMDB for a movie.
                        Films longer than {night.maxRuntimeMin} minutes
                        cannot be added to this night.
                    </p>

                    <SearchBar onSearch={handleSearch} />

                    {message && (
                        <p
                            className={
                                messageIsError
                                    ? "room-message error"
                                    : "room-message success"
                            }
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    
                    {loading && (
                        <LoadingIndicator text="Searching movies..." />
                    )}

                    {searchError && (
                        <p className="error-message">
                            {searchError}
                        </p>
                    )}

                    {!loading &&
                        !searchError &&
                        hasSearched &&
                        movies.length === 0 && (
                            <p className="room-empty">
                                No movies found.
                            </p>
                        )}

                    {!loading && !searchError && movies.length > 0 && (
                        <div className="night-search-grid">
                            {movies.map((movie, index) => {
                                const alreadySuggested =
                                    nightSuggestions.some(
                                        (s) => s.tmdbId === movie.id
                                    );

                                return (
                                    <div
                                        className="night-search-item"
                                        key={movie.id}
                                    >
                                        
                                        <MovieCard
                                            movie={movie}
                                            delay={index * 0.05}
                                            returnTo={`/nights/${id}`}
                                        />
          
                                        <button
                                            type="button"
                                            className="suggest-button"
                                            disabled={
                                                addingId !== null ||
                                                alreadySuggested
                                            }
                                            onClick={() => handleSuggest(movie)}
                                        >
                                            {alreadySuggested ? (
                                                "Already Suggested"
                                            ) : addingId === movie.id ? (
                                                <span className="button-loading">
                                                    <span className="mini-spinner"></span>
                                                    Checking...
                                                </span>
                                            ) : (
                                                "Suggest Movie"
                                            )}
                                        </button>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

        </section>
    );
}
