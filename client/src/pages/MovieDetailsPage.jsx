import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import WhereToWatch from "../components/WhereToWatch";
import LoadingIndicator from "../components/LoadingIndicator";
import {getMovieDetails, IMAGE_BASE_URL, BACKDROP_BASE_URL} from "../api/tmdb";

export default function MovieDetailsPage({
    currentUser,
    watchlist,
    watchlistError,
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onToggleWatched
}) {

    const { id } = useParams();

    const location = useLocation();

    const returnTo = location.state?.returnTo || "/";

    const backLabel = returnTo.endsWith("/results")
        ? "Back to Results"
        : returnTo.startsWith("/nights/")
            ? "Back to Night Room"
            : returnTo === "/watchlist"
                ? "Back to Watchlist"
                : returnTo === "/history"
                    ? "Back to History"
                    : "Back to Discover";

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [backdropLoaded, setBackdropLoaded] = useState(false);

    const savedMovie = movie && currentUser
        ? watchlist.find(
            (item) => item.tmdbId === Number(movie.id)
        )
        : null;

    useEffect(() => {
        let cancelled = false;

        async function loadMovie() {
            setLoading(true);
            setError("");
            setMovie(null);
            setBackdropLoaded(false);


            try {
                const data = await getMovieDetails(id);

                if (!cancelled) {
                    setMovie(data);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load movie details.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadMovie();

        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <section className="movie-details-page">
        
            <Link to={returnTo} className="back-link">
                ← {backLabel}
            </Link>
       
            {loading && (
                <LoadingIndicator text="Loading movie details..." />
            )}

            {!loading && error && (
                <p className="error-message" role="alert">{error}</p>
            )}

            {!loading && movie && (
                <article className="movie-details">

                    {movie.backdrop_path && (
                        <div className="movie-backdrop">
                            <img
                                src={`${BACKDROP_BASE_URL}${movie.backdrop_path}`}
                                alt=""
                                className={
                                    backdropLoaded
                                        ? "backdrop-image loaded"
                                        : "backdrop-image"
                                }
                                onLoad={() => setBackdropLoaded(true)}
                                decoding="async"
                                width="1280"
                                height="720"
                                loading="eager"
                                fetchPriority="high"
                            />
                        </div>
                    )}


                    <div className={
                        movie.backdrop_path
                            ? "movie-details-content"
                            : "movie-details-content no-backdrop"
                    }>

                        {movie.poster_path ? (
                            <img
                                className="details-poster"
                                src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                                alt={`${movie.title} poster`}
                                width="342"
                                height="513"
                                decoding="async"
                            />
                        ) : (
                            <div className="details-poster poster-placeholder">
                                No Poster Available
                            </div>
                        )}

                        <div className="details-info">

                            <h1>{movie.title}</h1>

                            {movie.tagline && (
                                <p className="movie-tagline">
                                    {movie.tagline}
                                </p>
                            )}

                            <div className="details-meta">
                                <span>
                                    {movie.release_date
                                        ? movie.release_date.slice(0, 4)
                                        : "Unknown year"}
                                </span>

                                <span>
                                    {movie.runtime
                                        ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                                        : "Runtime unavailable"}
                                </span>

                                <span>
                                    ★ {movie.vote_count > 0
                                        ? `${movie.vote_average.toFixed(1)}/10`
                                        : "Not rated"}
                                </span>
                            </div>

                            <p className="details-genres">
                                {movie.genres?.length
                                    ? movie.genres.map(
                                        genre => genre.name
                                    ).join(" • ")
                                    : "Genres unavailable"}
                            </p>

                            <h2>Overview</h2>

                            <p className="movie-overview">
                                {movie.overview ||
                                    "No description available."}
                            </p>

                            <a
                                href={`https://www.themoviedb.org/movie/${movie.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tmdb-link"
                            >
                                View on TMDB
                            </a>

                            {/* PERSONAL WATCHLIST */}

                            <div className="details-watchlist">
                                
                                {watchlistError && (
                                    <p className="room-message error" role="alert">
                                        {watchlistError}
                                    </p>
                                )}

                                {currentUser ? (

                                    savedMovie ? (
                                        <>
                                            <button
                                                type="button"
                                                className="watchlist-action"
                                                onClick={() => onToggleWatched(movie.id)}
                                            >
                                                {savedMovie.watched
                                                    ? "Mark as Not Watched"
                                                    : "Mark as Watched"}
                                            </button>

                                            <button
                                                type="button"
                                                className="watchlist-action secondary"
                                                onClick={() => onRemoveFromWatchlist(movie.id)}
                                            >
                                                Remove from Watchlist
                                            </button>

                                            <Link
                                                to="/watchlist"
                                                className="watchlist-view-link"
                                            >
                                                View My Watchlist
                                            </Link>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="watchlist-action"
                                            onClick={() => onAddToWatchlist(movie)}
                                        >
                                            + Add to Watchlist
                                        </button>
                                    )

                                ) : (
                                    <p className="watchlist-login">
                                        <Link to="/login">Log in</Link>
                                        {" "}to save this movie to your watchlist.
                                    </p>
                                )}

                            </div>


                        </div>
                    </div>

                    {/* STREAMING PROVIDERS */}
                    <WhereToWatch movieId={movie.id} />

                </article>
            )}

        </section>
    );
}
