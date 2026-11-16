import { apiRequest } from "./backend";

// All movie nights belonging to the current user
export function getMyNights({ signal } = {}) {
    return apiRequest("/nights", { signal });
}

// Create a movie night in MongoDB
export function createNight({ title, maxRuntimeMin }) {
    return apiRequest("/nights", {
        method: "POST",
        body: { title, maxRuntimeMin }
    });
}

// Join using an invitation code
export function joinNight(joinCode) {
    return apiRequest("/memberships", {
        method: "POST",
        body: { joinCode }
    });
}

// Retrieve one night and its members
export function getNight(id, { signal } = {}) {
    return apiRequest(
        `/nights/${encodeURIComponent(id)}`,
        { signal }
    );
}

export function addNightSuggestion(nightId, tmdbId) {
    return apiRequest(
        `/nights/${encodeURIComponent(nightId)}/suggestions`,
        {
            method: "POST",
            body: { tmdbId }
        }
    );
}

export function removeNightSuggestion(nightId, suggestionId) {
    return apiRequest(
        `/nights/${encodeURIComponent(nightId)}/suggestions/${encodeURIComponent(suggestionId)}`,
        {
            method: "DELETE"
        }
    );
}
