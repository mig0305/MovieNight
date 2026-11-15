import { Link, useParams } from "react-router-dom";
import { IMAGE_BASE_URL } from "../api/tmdb";

export default function ResultsPage({ nights, currentUser }) {

    const { id } = useParams();

    const night = nights.find((n) => n.id === id);

    if (!night) {
        return (
            <section className="results-page">
                <h1>Movie night not found</h1>
                <Link to="/nights">Back to My Nights</Link>
            </section>
        );
    }

    if (!night.memberEmails.includes(currentUser.email)) {
        return (
            <section className="results-page">
                <h1>Access denied</h1>
                <p>You are not a member of this movie night.</p>
                <Link to="/nights">Back to My Nights</Link>
            </section>
        );
    }

    if (night.status !== "completed" || !night.result) {
        return (
            <section className="results-page">
                <h1>Results Not Available Yet</h1>
                <p>The host has not closed voting.</p>

                <Link
                    to={`/nights/${id}`}
                    className="back-link"
                >
                    Back to Night Room
                </Link>
            </section>
        );
    }

    const {
        winner,
        runnersUp,
        excluded,
        ballotCount,
        memberCount
    } = night.result;

    return (
        <section className="results-page">

            <Link to="/nights" className="back-link">
                ← Back to My Nights
            </Link>

            <div className="results-header">
                <span className="results-label">
                    THE RESULTS ARE IN
                </span>

                <h1>{night.title}</h1>

                <p>
                    {ballotCount} of {memberCount} members voted
                </p>

                <p className="results-date">
                    Finalized on{" "}
                    {new Date(night.finalizedAt).toLocaleString()}
                </p>
            </div>

            {/* WINNING MOVIE */}

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
                        {winner.points} points
                    </p>

                    <p>
                        Runtime: {winner.runtime} min
                    </p>

                    <p>
                        TMDB Rating:{" "}
                        {winner.voteAverage.toFixed(1)}/10
                    </p>

                    <p className="winner-reason">
                        {winner.reason}
                    </p>

                    <Link
                        to={`/movie/${winner.tmdbId}`}
                        state={{ returnTo: `/nights/${id}/results` }}
                        className="night-button"
                    >
                        View Movie Details
                    </Link>

                </div>
            </div>

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
                            <div
                                className="result-item"
                                key={movie.id}
                            >
                                <span className="result-position">
                                    #{index + 2}
                                </span>

                                {movie.posterPath ? (
                                    <img
                                        src={
                                            IMAGE_BASE_URL +
                                            movie.posterPath
                                        }
                                        alt={`${movie.title} poster`}
                                    />
                                ) : (
                                    <div className="result-placeholder">
                                        No poster
                                    </div>
                                )}

                                <div className="result-info">
                                    <h3>
                                        <Link to={`/movie/${movie.tmdbId}`} state={{ returnTo: `/nights/${id}/results` }}> 
                                            {movie.title}
                                        </Link>
                                    </h3>

                                    <p>
                                        {movie.points} points
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
                                        src={
                                            IMAGE_BASE_URL +
                                            movie.posterPath
                                        }
                                        alt={`${movie.title} poster`}
                                    />
                                ) : (
                                    <div className="result-placeholder">
                                        No poster
                                    </div>
                                )}

                                <div className="result-info">
                                    <h3>
                                        <Link to={`/movie/${movie.tmdbId}`} state={{ returnTo: `/nights/${id}/results` }}>
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
