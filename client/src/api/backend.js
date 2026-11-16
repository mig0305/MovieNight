export const TOKEN_KEY = "movieNightToken";
export const AUTH_EXPIRED_EVENT = "movie-night:auth-expired";

// Empty by default: requests use the existing Vite proxy.
// If configured later, this should contain only the backend origin,
// for example https://api.example.com, without /api.
const API_ORIGIN = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
    const {
        body,
        headers,
        authenticated = true,
        token: suppliedToken,
        ...requestOptions
    } = options;

    const token = authenticated
        ? suppliedToken ?? localStorage.getItem(TOKEN_KEY)
        : null;

    const requestHeaders = new Headers(headers);

    if (body !== undefined) {
        requestHeaders.set("Content-Type", "application/json");
    }

    if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    let response;

    try {
        response = await fetch(`${API_ORIGIN}/api${path}`, {
            ...requestOptions,
            headers: requestHeaders,
            ...(body !== undefined
                ? { body: JSON.stringify(body) }
                : {})
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new Error(
            "Cannot reach the API. Check that the backend is running."
        );
    }

    // Only authenticated requests trigger session expiration.
    // Wrong credentials on the login form remain a form error.
    if (response.status === 401 && authenticated && token) {
        window.dispatchEvent(
            new CustomEvent(AUTH_EXPIRED_EVENT, {
                detail: { token }
            })
        );
    }

    if (response.status === 204 && response.ok) {
        return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            data?.error ||
            data?.message ||
            `API request failed (${response.status}).`
        );

        error.status = response.status;
        throw error;
    }

    if (data === null) {
        throw new Error(
            "The API returned an empty or invalid JSON response."
        );
    }

    return data;
}