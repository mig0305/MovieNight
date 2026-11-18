import { MovieCard } from "./MovieCard";

export function MovieList({ movies }) {

    if (movies.length === 0) {
        return <p className="noMovies">No movies found.</p>;
    }

    return (
        <div className="movie-list">
            {movies.map((movie, index) => (
                <MovieCard
                    key={movie.tmdbId ?? movie.id}
                    movie={movie}
                    delay={index * 0.05}
                />
            ))}
        </div>
    );
}
