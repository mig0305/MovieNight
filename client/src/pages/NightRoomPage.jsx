import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { SearchBar } from "../components/SearchBar";
import { MovieCard } from "../components/MovieCard";
import LoadingIndicator from "../components/LoadingIndicator";

import { IMAGE_BASE_URL } from "../api/tmdb";
import { useAuth } from "../auth/useAuth";

import {
    getNight,
    addNightSuggestion,
    removeNightSuggestion
} from "../api/nights";

import {
    searchNightMovies,
    getNightMovie
} from "../api/movies";

export default function NightRoomPage() {
    const { id } = useParams();
    const { currentUser } = useAuth();

    const [night, setNight] = useState(null);
    const [nightLoading, setNightLoading] = useState(true);
    const [nightError, setNightError] = useState("");
    const [syncError, setSyncError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [movies, setMovies] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState("");

    const [addingId, setAddingId] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [message, setMessage] = useState("");
    const [messageIsError, setMessageIsError] = useState(false);

    const searchRequestId = useRef(0);

    // Load real room data, then poll every 15 seconds.
    useEffect(() => {
        const controller = new AbortController();
        let inFlight = false;

        async function loadRoom(initial = false) {
            if (inFlight) return;

            inFlight = true;

            if (initial) {
                setNightLoading(true);
                setNightError("");
                setSyncError("");
            }

            try {
                const data = await getNight(id, {
                    signal: controller.signal
                });

                if (
                    !data?._id ||
                    !Array.isArray(data.members) ||
                    !Array.isArray(data.suggestions)
                ) {
                    throw new Error(
                        "The API returned an invalid night room."
                    );
                }

                if (!controller.signal.aborted) {
                    setNight(data);
                    setNightError("");
                    setSyncError("");
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    if (initial) {
                        setNightError(error.message);
                    } else {
                        setSyncError(
                            "Could not refresh. Showing the last loaded data."
                        );
                    }
                }
            } finally {
                inFlight = false;

                if (initial && !controller.signal.aborted) {
                    setNightLoading(false);
                }
            }
        }

        loadRoom(true);

        const interval = setInterval(
            () => loadRoom(false),
            15000
        );

        return () => {
            clearInterval(interval);
            controller.abort();
        };
    }, [id, refreshKey]);

    // Reset old search results when navigating to another room.
    useEffect(() => {
        searchRequestId.current += 1;
        setMovies([]);
        setHasSearched(false);
        setSearchError("");
        setMessage("");
    }, [id]);

    // Search TMDB through our Express backend.
    async function handleSearch(query) {
        const requestId = ++searchRequestId.current;

        setSearchLoading(true);
        setHasSearched(true);
        setSearchError("");
        setMovies([]);

        try {
            const data = await searchNightMovies(query);

            // Ignore an older search that finished late.
            if (requestId !== searchRequestId.current) {
                return;
            }

            if (!Array.isArray(data?.results)) {
                throw new Error(
                    "The movie search returned invalid data."
                );
            }

            setMovies(data.results);
        } catch (error) {
            if (requestId === searchRequestId.current) {
                setSearchError(error.message);
            }
        } finally {
            if (requestId === searchRequestId.current) {
                setSearchLoading(false);
            }
        }
    }

    // Save a suggestion to MongoDB.
    async function handleSuggest(movie) {
        if (
            !night ||
            night.status !== "open" ||
            addingId !== null ||
            removingId !== null
        ) {
            return;
        }

        setAddingId(movie.tmdbId);
        setMessage("");

        try {
            const details = await getNightMovie(movie.tmdbId);

            if (
                !Number.isInteger(details.runtime) ||
                details.runtime <= 0
            ) {
                throw new Error(
                    "This movie has no valid runtime on TMDB."
                );
            }

            if (details.runtime > night.maxRuntimeMin) {
                throw new Error(
                    `${details.title} is ${details.runtime} minutes long. ` +
                    `This night's limit is ${night.maxRuntimeMin} minutes.`
                );
            }

            await addNightSuggestion(id, movie.tmdbId);

            setMessage(
                `${details.title} was added successfully!`
            );
            setMessageIsError(false);

            // Re-fetch the updated room from MongoDB.
            setRefreshKey((value) => value + 1);
        } catch (error) {
            setMessage(error.message);
            setMessageIsError(true);
        } finally {
            setAddingId(null);
        }
    }

    // Delete a suggestion from MongoDB.
    async function handleRemove(suggestionId) {
        if (removingId !== null || addingId !== null) {
            return;
        }

        setRemovingId(suggestionId);
        setMessage("");

        try {
            await removeNightSuggestion(id, suggestionId);

            setMessage("Movie suggestion removed.");
            setMessageIsError(false);

            setRefreshKey((value) => value + 1);
        } catch (error) {
            setMessage(error.message);
            setMessageIsError(true);
        } finally {
            setRemovingId(null);
        }
    }

    if (nightLoading) {
        return (
            <LoadingIndicator text="Loading movie night..." />
        );
    }

    if (nightError || !night) {
        return (
            <section className="night-room-page">
                <Link to="/nights" className="back-link">
                    ← Back to My Nights
                </Link>

                <h1>Unable to open movie night</h1>

                <p
                    className="room-message error"
                    role="alert"
                >
                    {nightError || "Movie night not found."}
                </p>

                <button
                    type="button"
                    className="night-button secondary"
                    onClick={() =>
                        setRefreshKey((value) => value + 1)
                    }
                >
                    Retry
                </button>
            </section>
        );
    }

    const isOpen = night.status === "open";

    const ownerId =
        night.owner?._id ?? night.owner;

    const isOwner =
        night.isOwner ??
        (String(ownerId) === String(currentUser.id));

    const memberCount = night.members.length;
    const suggestions = night.suggestions;

    const ballotCount = Math.min(
        night.ballotsCast ?? 0,
        memberCount
    );

    const hasVoted =
    Array.isArray(night.myBallot?.ranking) &&
    night.myBallot.ranking.length === 3;

    const votingPercentage = memberCount > 0
        ? Math.round((ballotCount / memberCount) * 100)
        : 0;

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
                        {isOwner
                            ? "You are hosting this movie night."
                            : "You are a member of this movie night."}
                    </p>
                </div>

                <span
                    className={
                        `night-status ${
                            isOpen ? "active" : "completed"
                        }`
                    }
                >
                    {isOpen ? "Active" : "Closed"}
                </span>
            </div>

            <div className="room-stats">
                <div className="room-stat">
                    <span>Maximum runtime</span>
                    <strong>
                        {night.maxRuntimeMin} min
                    </strong>
                </div>

                <div className="room-stat">
                    <span>Members</span>
                    <strong>{memberCount}</strong>
                </div>

                <div className="room-stat">
                    <span>Invitation code</span>
                    <strong>{night.joinCode}</strong>
                </div>
            </div>

            {/* GROUP MEMBERS */}

            <div className="room-section">
                <div className="room-header">
                    <h2>Group Members</h2>

                    <button
                        type="button"
                        className="night-button secondary"
                        onClick={() =>
                            setRefreshKey((value) => value + 1)
                        }
                    >
                        Refresh Room
                    </button>
                </div>

                {syncError && (
                    <p
                        className="room-message error"
                        role="alert"
                    >
                        {syncError}
                    </p>
                )}

                <div className="room-members">
                    {night.members.map((member) => (
                        <div
                            className="room-member"
                            key={member._id}
                        >
                            <span>
                                {member.displayName}
                                {String(member._id) ===
                                String(currentUser.id)
                                    ? " (You)"
                                    : ""}
                            </span>

                            {String(member._id) ===
                                String(ownerId) && (
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
                    {ballotCount} of {memberCount} members
                    have submitted ballots.
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
                        style={{
                            width: `${votingPercentage}%`
                        }}
                    />
                </div>

                {isOpen ? (
                    suggestions.length >= 3 ? (
                        <div className="voting-action">
                            <p>
                                {hasVoted
                                    ? "Your ballot is saved. You can update it while voting is open."
                                    : "Rank your top three movies and optionally use your veto."}
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
                            At least three suggested movies are
                            needed before voting can begin.
                        </p>
                    )
                ) : (
                    <p className="room-hint">
                        Voting is closed. Final results will
                        be connected in Milestone 6.
                    </p>
                )}
            </div>

            {/* SAVED SUGGESTIONS */}

            <div className="room-section">
                <h2>
                    Suggested Movies ({suggestions.length})
                </h2>

                {suggestions.length === 0 ? (
                    <p className="room-empty">
                        No movies suggested yet.
                        Be the first to suggest one!
                    </p>
                ) : (
                    <div className="suggestions-list">
                        {suggestions.map((suggestion) => {
                            const addedById =
                                suggestion.addedBy?._id ??
                                suggestion.addedBy;

                            const canRemove = isOpen && (
                                isOwner ||
                                String(addedById) ===
                                String(currentUser.id)
                            );

                            return (
                                <div
                                    className="suggestion-card"
                                    key={suggestion._id}
                                >
                                    <Link
                                        to={`/movie/${suggestion.tmdbId}`}
                                        state={{
                                            returnTo:
                                                `/nights/${id}`
                                        }}
                                    >
                                        {suggestion.posterPath ? (
                                            <img
                                                src={
                                                    IMAGE_BASE_URL +
                                                    suggestion.posterPath
                                                }
                                                alt={
                                                    suggestion.title
                                                }
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="suggestion-no-poster">
                                                No poster
                                            </div>
                                        )}
                                    </Link>

                                    <div className="suggestion-info">
                                        <h3>
                                            <Link
                                                to={`/movie/${suggestion.tmdbId}`}
                                                state={{
                                                    returnTo:
                                                        `/nights/${id}`
                                                }}
                                            >
                                                {suggestion.title}
                                            </Link>
                                        </h3>

                                        <p>
                                            Runtime:{" "}
                                            {suggestion.runtime} min
                                        </p>

                                        <p>
                                            TMDB rating:{" "}
                                            {suggestion.voteAverage.toFixed(1)}/10
                                        </p>

                                        <p>
                                            Suggested by:{" "}
                                            {String(addedById) ===
                                            String(currentUser.id)
                                                ? "You"
                                                : suggestion.addedBy
                                                    ?.displayName ??
                                                    "Member"}
                                        </p>
                                    </div>

                                    {canRemove && (
                                        <button
                                            type="button"
                                            className="remove-suggestion"
                                            disabled={
                                                removingId !== null ||
                                                addingId !== null
                                            }
                                            onClick={() =>
                                                handleRemove(
                                                    suggestion._id
                                                )
                                            }
                                        >
                                            {removingId === suggestion._id
                                                ? "Removing..."
                                                : "Remove"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SEARCH AND ADD MOVIES */}

            {isOpen ? (
                <div className="room-section night-search-section">
                    <h2>Suggest a Movie</h2>

                    <p className="room-hint">
                        Search for a movie.
                        Films longer than{" "}
                        {night.maxRuntimeMin} minutes
                        or without a valid runtime
                        cannot be suggested.
                    </p>

                    <SearchBar onSearch={handleSearch} />

                    {message && (
                        <p
                            className={
                                `room-message ${
                                    messageIsError
                                        ? "error"
                                        : "success"
                                }`
                            }
                            role={
                                messageIsError
                                    ? "alert"
                                    : "status"
                            }
                        >
                            {message}
                        </p>
                    )}

                    {searchLoading && (
                        <LoadingIndicator
                            text="Searching movies..."
                        />
                    )}

                    {searchError && (
                        <p
                            className="error-message"
                            role="alert"
                        >
                            {searchError}
                        </p>
                    )}

                    {!searchLoading &&
                        !searchError &&
                        hasSearched &&
                        movies.length === 0 && (
                            <p className="room-empty">
                                No movies found.
                            </p>
                        )}

                    {!searchLoading &&
                        !searchError &&
                        movies.length > 0 && (
                            <div className="night-search-grid">
                                {movies.map((movie, index) => {
                                    const alreadySuggested =
                                        suggestions.some(
                                            (suggestion) =>
                                                suggestion.tmdbId ===
                                                movie.tmdbId
                                        );

                                    return (
                                        <div
                                            className="night-search-item"
                                            key={movie.tmdbId}
                                        >
                                            <MovieCard
                                                movie={movie}
                                                delay={index * 0.05}
                                                returnTo={
                                                    `/nights/${id}`
                                                }
                                            />

                                            <button
                                                type="button"
                                                className="suggest-button"
                                                disabled={
                                                    addingId !== null ||
                                                    removingId !== null ||
                                                    alreadySuggested
                                                }
                                                onClick={() =>
                                                    handleSuggest(movie)
                                                }
                                            >
                                                {alreadySuggested
                                                    ? "Already Suggested"
                                                    : addingId ===
                                                        movie.tmdbId
                                                        ? "Checking..."
                                                        : "Suggest Movie"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            ) : (
                <div className="room-section completed-room">
                    <h2>Movie Night Closed</h2>

                    <p className="room-hint">
                        Suggestions cannot be changed.
                        Final results will be connected
                        in Milestone 6.
                    </p>
                </div>
            )}
        </section>
    );
}

