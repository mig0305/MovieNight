const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const headers = {
    Authorization: `Bearer ${TOKEN}`,   //proof we need to be allowed to make a request 
    accept: "application/json",  //telling the server what format we want back
};


export async function getPopularMovies() {
    const url = `${BASE_URL}/movie/popular`;

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Fetch failed:", error);
        throw error;
        }
}

export async function searchMovies(query) {
    const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`;  //query is a placeholder for whatever text the user actually types into the search bar

    try {
        const response = await fetch(url, { headers});

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch(error) {
        console.error("Search failed:", error);
        throw error;
    }
}

export async function getMovieDetails(movieId) {
    const url = `${BASE_URL}/movie/${movieId}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

export async function getWatchProviders(movieId) {

    const url = `${BASE_URL}/movie/${movieId}/watch/providers`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(
            `Could not fetch providers: ${response.status}`
        );
    }

    const data = await response.json();

    return data.results || {};
}
