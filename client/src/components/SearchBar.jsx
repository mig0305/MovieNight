import { useState } from "react";

export function SearchBar({ onSearch }) {
    const [inputValue, setInputValue] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        const query = inputValue.trim();

        if (!query) return;

        onSearch(query);
    }

    return (
        <form
            className="movie-search-form"
            onSubmit={handleSubmit}
            role="search"
            autoComplete="off"
        >
            <label
                htmlFor="movie-search"
                className="sr-only"
            >
                Search for a movie
            </label>

            <input
                id="movie-search"
                type="search"
                name="movie-query"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search for a movie..."
                required
            />

            <button type="submit">
                Search
            </button>
        </form>
    );
}
