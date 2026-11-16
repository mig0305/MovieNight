import { apiRequest } from "./backend";

// Search movies through our Express server.
export function searchNightMovies(query) {
    const params = new URLSearchParams({
        query: query.trim(),
        page: "1"
    });

    return apiRequest(`/movies/search?${params}`, {
        authenticated: false
    });
}

// Retrieve official movie details through Express.
export function getNightMovie(tmdbId) {
    return apiRequest(
        `/movies/${encodeURIComponent(tmdbId)}`,
        {
            authenticated: false
        }
    );
}
