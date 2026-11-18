import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import WatchlistPage from "./WatchlistPage";

// Shaped like the documents Express returns from GET /api/watchlist
const watchlist = [
    {
        _id: "w1",
        tmdbId: 862,
        title: "Toy Story",
        posterPath: null,
        releaseDate: "1995-10-30",
        runtime: 81,
        watched: false,
        createdAt: "2026-11-20T10:00:00.000Z"
    },
    {
        _id: "w2",
        tmdbId: 12,
        title: "Finding Nemo",
        posterPath: null,
        releaseDate: "2003-05-30",
        runtime: 100,
        watched: true,
        createdAt: "2026-11-21T10:00:00.000Z"
    }
];

function renderWatchlist(props = {}) {
    const handlers = {
        onRemoveFromWatchlist: vi.fn(),
        onToggleWatched: vi.fn()
    };

    render(
        <MemoryRouter>
            <WatchlistPage
                watchlist={watchlist}
                watchlistError=""
                {...handlers}
                {...props}
            />
        </MemoryRouter>
    );

    return handlers;
}

test("shows the saved movies and counters", () => {
    renderWatchlist();

    expect(screen.getByText("Toy Story")).toBeInTheDocument();
    expect(screen.getByText("Finding Nemo")).toBeInTheDocument();
    expect(screen.getByText("Total Movies").previousSibling).toHaveTextContent("2");
});

test("filters watched movies", () => {
    renderWatchlist();

    fireEvent.click(screen.getByRole("button", { name: "Watched" }));

    expect(screen.getByText("Finding Nemo")).toBeInTheDocument();
    expect(screen.queryByText("Toy Story")).not.toBeInTheDocument();
});

test("calls the handlers with the TMDB id", () => {
    const { onToggleWatched, onRemoveFromWatchlist } = renderWatchlist();

    fireEvent.click(
        screen.getAllByRole("button", { name: "Mark as Watched" })[0]
    );
    expect(onToggleWatched).toHaveBeenCalledWith(862);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(onRemoveFromWatchlist).toHaveBeenCalledWith(12);
});

test("shows a server error", () => {
    renderWatchlist({
        watchlistError: "This movie is already in your watchlist"
    });

    expect(
        screen.getByRole("alert")
    ).toHaveTextContent("This movie is already in your watchlist");
});