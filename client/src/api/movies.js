import { apiRequest } from "./backend";

// Search movies through Express and return the results array.
async function searchMoviePage(query, page = 1) {
    const params = new URLSearchParams({
        query: query.trim(),
        page: String(page)
    });

    return apiRequest(`/movies/search?${params.toString()}`, {
        authenticated: false
    });
}

// 1. Retrieve popular movies for the Discover page.
export async function getPopularMovies(page = 1) {
    const params = new URLSearchParams({
        page: String(page)
    });

    const data = await apiRequest(
        `/movies/popular?${params.toString()}`,
        { authenticated: false }
    );

    return data.results ?? [];
}

// 2. Search movies for the Discover page.
export async function searchMovies(query, page = 1) {
    const data = await searchMoviePage(query, page);

    return data.results ?? [];
}

// 3. Retrieve complete movie details.
export function getMovieDetails(tmdbId) {
    return apiRequest(
        `/movies/${encodeURIComponent(tmdbId)}`,
        { authenticated: false }
    );
}

// 4. Retrieve streaming and rental providers.
export function getWatchProviders(tmdbId) {
    return apiRequest(
        `/movies/${encodeURIComponent(tmdbId)}/providers`,
        { authenticated: false }
    );
}

// Search movies for Night Room.
// Returns the complete paginated response, including results.
export function searchNightMovies(query) {
    return searchMoviePage(query);
}

// Retrieve movie details for Night Room runtime validation.
export function getNightMovie(tmdbId) {
    return getMovieDetails(tmdbId);
}