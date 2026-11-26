import { useState, useEffect } from "react";
import { getPopularMovies, searchMovies } from "../api/movies";
import { SearchBar } from "../components/SearchBar";
import { MovieList } from "../components/MovieList";
import LoadingIndicator from "../components/LoadingIndicator";

export default function DiscoverPage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");

    // Display popular movies when the page first loads
    useEffect(() => {
        if (hasSearched) return;

        let cancelled = false;

        async function loadPopularMovies() {
            setLoading(true);
            setError("");

            try {
                const results = await getPopularMovies();

                if (!cancelled) {
                    setMovies(results);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load popular movies.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPopularMovies();

        return () => {
            cancelled = true;
        };
    }, [hasSearched]);

    // Called when the user submits a search
    async function handleSearch(query) {
        if (!query.trim()) return;

        setHasSearched(true);
        setLoading(true);
        setError("");

        try {
            const results = await searchMovies(query.trim());
            setMovies(results);
        } catch {
            setMovies([]);
            setError("Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function showPopular() {
        setMovies([]);
        setHasSearched(false);
    }

    return (
        <section className="discover-page">

            <h1 className="app-title">
                Discover Your Next Movie
            </h1>

            <p className="page-subtitle">
                Search, explore, and find the perfect movie night pick.
            </p>

            <SearchBar onSearch={handleSearch} />

            <div className="discover-heading">
                <h2>
                    {hasSearched ? "Search Results" : "Popular Movies"}
                </h2>

                {hasSearched && !loading && (
                    <button
                        type="button"
                        className="back-to-popular"
                        onClick={showPopular}
                    >
                        Back to Popular
                    </button>
                )}
            </div>

            {loading && (
                <LoadingIndicator
                    text={
                        hasSearched
                            ? "Searching movies..."
                            : "Discovering popular movies..."
                    }
                />
            )}

            {!loading && error && (
                <p className="error-message" role="alert">{error}</p>
            )}

            {!loading && !error && (
                <MovieList movies={movies} />
            )}

        </section>
    );
}
