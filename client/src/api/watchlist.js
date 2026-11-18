import { apiRequest } from "./backend";

// My saved movies, newest first
export function getWatchlist({ signal } = {}) {
    return apiRequest("/watchlist", { signal });
}

// Save a movie. Express copies its details from TMDB itself.
export function addToWatchlist(tmdbId) {
    return apiRequest("/watchlist", {
        method: "POST",
        body: { tmdbId: Number(tmdbId) }
    });
}

// Mark a saved movie as watched (true) or not watched (false)
export function setWatchlistWatched(tmdbId, watched) {
    return apiRequest(
        `/watchlist/${encodeURIComponent(tmdbId)}`,
        {
            method: "PATCH",
            body: { watched }
        }
    );
}

// Remove a movie from my watchlist
export function removeFromWatchlist(tmdbId) {
    return apiRequest(
        `/watchlist/${encodeURIComponent(tmdbId)}`,
        {
            method: "DELETE"
        }
    );
}