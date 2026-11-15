import { useState } from "react";
import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../api/tmdb";

export default function WatchlistPage({
    watchlist,
    currentUser,
    onRemoveFromWatchlist,
    onToggleWatched
}) {
    const [filter, setFilter] = useState("all");

    // Only this user's movies, newest first
    const myMovies = watchlist
        .filter(
            (item) => item.userEmail === currentUser.email
        )
        .sort(
            (a, b) =>
                new Date(b.addedAt) - new Date(a.addedAt)
        );

    const watchedCount = myMovies.filter(
        (item) => item.watched
    ).length;

    const toWatchCount = myMovies.length - watchedCount;

    // Apply the selected filter
    const visibleMovies = myMovies.filter((item) => {
        if (filter === "watched") return item.watched;
        if (filter === "toWatch") return !item.watched;

        return true;
    });

    return (
        <section className="watchlist-page">

            <div className="watchlist-header">
                <h1>My Watchlist</h1>
                <p>
                    Save interesting movies and keep track
                    of what you've watched.
                </p>
            </div>

            {/* WATCHLIST COUNTERS */}

            <div className="watchlist-stats">
                <div>
                    <strong>{myMovies.length}</strong>
                    <span>Total Movies</span>
                </div>

                <div>
                    <strong>{toWatchCount}</strong>
                    <span>To Watch</span>
                </div>

                <div>
                    <strong>{watchedCount}</strong>
                    <span>Watched</span>
                </div>
            </div>

            {/* FILTER BUTTONS */}

            <div className="watchlist-filters">
                <button
                    type="button"
                    className={filter === "all" ? "selected" : ""}
                    onClick={() => setFilter("all")}
                >
                    All Movies
                </button>

                <button
                    type="button"
                    className={filter === "toWatch" ? "selected" : ""}
                    onClick={() => setFilter("toWatch")}
                >
                    To Watch
                </button>

                <button
                    type="button"
                    className={filter === "watched" ? "selected" : ""}
                    onClick={() => setFilter("watched")}
                >
                    Watched
                </button>
            </div>

            {/* WATCHLIST CONTENT */}

            {visibleMovies.length === 0 ? (

                <div className="watchlist-empty">
                    <h2>No movies here yet</h2>

                    <p>
                        {myMovies.length === 0
                            ? "Explore movies and save your favorites."
                            : "No movies match this filter."}
                    </p>

                    {myMovies.length === 0 && (
                        <Link
                            to="/"
                            className="night-button"
                        >
                            Discover Movies
                        </Link>
                    )}
                </div>

            ) : (

                <div className="watchlist-grid">

                    {visibleMovies.map((movie) => (

                        <article
                            className="watchlist-card"
                            key={movie.tmdbId}
                        >
                            <Link to={`/movie/${movie.tmdbId}`} state={{ returnTo: "/watchlist" }}>

                                {movie.posterPath ? (
                                    <img
                                        src={
                                            IMAGE_BASE_URL +
                                            movie.posterPath
                                        }
                                        alt={`${movie.title} poster`}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="poster-placeholder">
                                        No Poster Available
                                    </div>
                                )}

                            </Link>

                            <div className="watchlist-card-body">

                                <h3>
                                    <Link
                                        to={`/movie/${movie.tmdbId}`} state={{ returnTo: "/watchlist" }}>
                                        {movie.title}
                                    </Link>
                                </h3>

                                <p>
                                    {movie.releaseDate
                                        ? movie.releaseDate.slice(0, 4)
                                        : "Unknown year"}
                                    {" · "}
                                    {movie.runtime
                                        ? `${movie.runtime} min`
                                        : "Runtime unknown"}
                                </p>

                                <span
                                    className={
                                        movie.watched
                                            ? "watchlist-status watched"
                                            : "watchlist-status"
                                    }
                                >
                                    {movie.watched
                                        ? "Watched"
                                        : "To Watch"}
                                </span>

                                <button
                                    type="button"
                                    className="watchlist-toggle"
                                    onClick={() =>
                                        onToggleWatched(movie.tmdbId)
                                    }
                                >
                                    {movie.watched
                                        ? "Mark as Not Watched"
                                        : "Mark as Watched"}
                                </button>

                                <button
                                    type="button"
                                    className="watchlist-remove"
                                    onClick={() =>
                                        onRemoveFromWatchlist(
                                            movie.tmdbId
                                        )
                                    }
                                >
                                    Remove
                                </button>

                            </div>
                        </article>
                    ))}

                </div>
            )}
        </section>
    );
}
