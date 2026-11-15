import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../api/tmdb";


export function MovieCard({
    movie,
    delay = 0,
    returnTo = "/",
    priority = false
}) {

    return ( 
        <Link
            to={`/movie/${movie.id}`}
            state={{
                returnTo: returnTo
            }}
            className="movie-card"
            style={{ animationDelay: `${delay}s` }}
        >
            {movie.poster_path ? (
                <img
                    src={`${IMAGE_BASE_URL}${movie.poster_path}`}
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
                {movie.release_date
                    ? movie.release_date.slice(0, 4)
                    : "Unknown year"}
            </p>

            <p className="movie-rating">
                ★ {movie.vote_count > 0
                    ? movie.vote_average.toFixed(1)  //toFixed(1) rounds ratings to one decimal place
                    : "Not rated"}
            </p>
        </Link>
    );
}



