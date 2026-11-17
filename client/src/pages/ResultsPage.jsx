import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import LoadingIndicator from "../components/LoadingIndicator";
import { IMAGE_BASE_URL } from "../api/tmdb";
import { getNight, getNightResult } from "../api/nights";

const pts = (n) => `${n} ${n === 1 ? "point" : "points"}`;

export default function ResultsPage() {
    const { id } = useParams();

    const [night, setNight] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    // Load the night and its official result together.
    useEffect(() => {
        const controller = new AbortController();

        async function loadResults() {
            setLoading(true);
            setError("");

            try {
                const [nightData, resultData] = await Promise.all([
                    getNight(id, { signal: controller.signal }),
                    getNightResult(id, { signal: controller.signal })
                ]);

                if (
                    !nightData?._id ||
                    !Array.isArray(nightData.members) ||
                    !Array.isArray(resultData?.standings)
                ) {
                    throw new Error(
                        "The API returned an invalid result."
                    );
                }

                if (!controller.signal.aborted) {
                    setNight(nightData);
                    setResult(resultData);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadResults();

        return () => controller.abort();
    }, [id, reloadKey]);

    if (loading) {
        return <LoadingIndicator text="Loading results..." />;
    }

    if (error || !night || !result) {
        return (
            <section className="results-page">
                <Link to="/nights" className="back-link">
                    ← Back to My Nights
                </Link>

                <h1>Unable to load results</h1>

                <p className="room-message error" role="alert">
                    {error || "Movie night not found."}
                </p>

                <button
                    type="button"
                    className="night-button secondary"
                    onClick={() => setReloadKey((value) => value + 1)}
                >
                    Retry
                </button>
            </section>
        );
    }

    // The backend computes a live result while the night is open.
    // We only reveal it once the host has closed voting.
    if (!result.final) {
        return (
            <section className="results-page">
                <h1>Results Not Available Yet</h1>

                <p>The host has not closed voting.</p>

                <button
                    type="button"
                    className="night-button secondary"
                    onClick={() => setReloadKey((value) => value + 1)}
                >
                    Check Again
                </button>

                <Link to={`/nights/${id}`} className="back-link">
                    ← Back to Night Room
                </Link>
            </section>
        );
    }

    const { winner, standings, ballots } = result;
    const memberCount = night.members.length;

    const runnersUp = standings.filter(
        (movie) => movie.status === "runner_up"
    );

    const excluded = standings.filter(
        (movie) =>
            movie.status === "vetoed" ||
            movie.status === "over_cap"
    );

    const returnTo = `/nights/${id}/results`;

    return (
        <section className="results-page">
            <Link to={`/nights/${id}`} className="back-link">
                ← Back to Night Room
            </Link>

            <div className="results-header">
                <span className="results-label">
                    THE RESULTS ARE IN
                </span>

                <h1>{night.title}</h1>

                <p>
                    {ballots} of {memberCount} members voted
                </p>

                <p className="results-date">
                    Voting closed on{" "}
                    {new Date(night.updatedAt).toLocaleString()}
                </p>
            </div>

            {/* WINNING MOVIE */}

            {winner ? (
                <div className="winner-card">
                    <div className="winner-image">
                        {winner.posterPath ? (
                            <img
                                src={IMAGE_BASE_URL + winner.posterPath}
                                alt={`${winner.title} poster`}
                            />
                        ) : (
                            <div className="poster-placeholder">
                                No Poster Available
                            </div>
                        )}
                    </div>

                    <div className="winner-info">
                        <span className="winner-badge">
                            WINNING MOVIE
                        </span>

                        <h2>{winner.title}</h2>

                        <p className="winner-score">
                            {pts(winner.points)}
                        </p>

                        <p>Runtime: {winner.runtime} min</p>

                        <p>
                            TMDB Rating:{" "}
                            {winner.voteAverage.toFixed(1)}/10
                        </p>

                        <p className="winner-reason">
                            {winner.reason}
                        </p>

                        <Link
                            to={`/movie/${winner.tmdbId}`}
                            state={{ returnTo }}
                            className="night-button"
                        >
                            View Movie Details
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="results-section">
                    <h2>No Winner</h2>

                    <p className="room-empty">
                        Every suggested movie was vetoed or
                        excluded, so no movie could win.
                    </p>
                </div>
            )}

            {/* RUNNERS-UP */}

            <div className="results-section">
                <h2>Runners-Up</h2>

                {runnersUp.length === 0 ? (
                    <p className="room-empty">
                        No other movies remained eligible.
                    </p>
                ) : (
                    <div className="results-list">
                        {runnersUp.map((movie, index) => (
                            <div className="result-item" key={movie.id}>
                                <span className="result-position">
                                    #{index + 2}
                                </span>

                                {movie.posterPath ? (
                                    <img
                                        src={IMAGE_BASE_URL + movie.posterPath}
                                        alt={`${movie.title} poster`}
                                    />
                                ) : (
                                    <div className="result-placeholder">
                                        No poster
                                    </div>
                                )}

                                <div className="result-info">
                                    <h3>
                                        <Link
                                            to={`/movie/${movie.tmdbId}`}
                                            state={{ returnTo }}
                                        >
                                            {movie.title}
                                        </Link>
                                    </h3>

                                    <p>
                                        {pts(movie.points)}
                                        {" · "}
                                        TMDB {movie.voteAverage.toFixed(1)}/10
                                    </p>

                                    <p className="result-reason">
                                        {movie.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* EXCLUDED MOVIES */}

            <div className="results-section">
                <h2>Excluded Movies</h2>

                {excluded.length === 0 ? (
                    <p className="room-empty">
                        No movies were excluded.
                    </p>
                ) : (
                    <div className="results-list">
                        {excluded.map((movie) => (
                            <div
                                className="result-item excluded"
                                key={movie.id}
                            >
                                {movie.posterPath ? (
                                    <img
                                        src={IMAGE_BASE_URL + movie.posterPath}
                                        alt={`${movie.title} poster`}
                                    />
                                ) : (
                                    <div className="result-placeholder">
                                        No poster
                                    </div>
                                )}

                                <div className="result-info">
                                    <h3>
                                        <Link
                                            to={`/movie/${movie.tmdbId}`}
                                            state={{ returnTo }}
                                        >
                                            {movie.title}
                                        </Link>
                                    </h3>

                                    <p className="result-reason">
                                        {movie.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="results-footer">
                <Link to="/nights" className="night-button">
                    Back to My Nights
                </Link>
            </div>
        </section>
    );
}