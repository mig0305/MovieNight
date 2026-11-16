
import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../api/tmdb";

export function MovieCard({
    movie,
    delay = 0,
    returnTo = "/",
    priority = false
}) {
    // Support both direct TMDB and Express movie responses.
    const movieId = movie.id ?? movie.tmdbId;
    const posterPath = movie.poster_path ?? movie.posterPath;
    const releaseDate = movie.release_date ?? movie.releaseDate;
    const voteAverage = movie.vote_average ?? movie.voteAverage;

    const hasRating = typeof movie.vote_count === "number"
        ? movie.vote_count > 0
        : typeof voteAverage === "number" && voteAverage > 0;

    return (
        <Link
            to={`/movie/${movieId}`}
            state={{ returnTo }}
            className="movie-card"
            style={{ animationDelay: `${delay}s` }}
        >
            {posterPath ? (
                <img
                    src={`${IMAGE_BASE_URL}${posterPath}`}
                    alt={movie.title}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                />
            ) : (
                <div className="poster-placeholder">
                    No Poster Available
                </div>
            )}

            <h3>{movie.title}</h3>

            <p>
                {releaseDate
                    ? releaseDate.slice(0, 4)
                    : "Unknown year"}
            </p>

            <p className="movie-rating">
                ★ {hasRating
                    ? voteAverage.toFixed(1)
                    : "Not rated"}
            </p>
        </Link>
    );
}




