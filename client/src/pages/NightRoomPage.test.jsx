import { beforeEach, expect, test, vi } from "vitest";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";

import NightRoomPage from "./NightRoomPage";

import { getNight, addNightSuggestion, removeNightSuggestion, closeNightVoting } from "../api/nights";
import { getNightMovie, searchNightMovies } from "../api/movies";

vi.mock("../auth/useAuth", () => ({
    useAuth: () => ({
        currentUser: {
            id: "userA",
            displayName: "Alice"
        }
    })
}));

vi.mock("../api/nights", () => ({
    getNight: vi.fn(),
    addNightSuggestion: vi.fn(),
    removeNightSuggestion: vi.fn(),
    closeNightVoting: vi.fn()
}));

vi.mock("../api/movies", () => ({
    searchNightMovies: vi.fn(),
    getNightMovie: vi.fn()
}));

const room = {
    _id: "night123",
    title: "Friday Movie Night",
    owner: {
        _id: "userA",
        displayName: "Alice"
    },
    members: [
        {
            _id: "userA",
            displayName: "Alice"
        },
        {
            _id: "userB",
            displayName: "Bob"
        }
    ],
    status: "open",
    isOwner: true,
    maxRuntimeMin: 120,
    joinCode: "ABC123",
    ballotsCast: 0,
    suggestions: []
};

function renderRoom() {
    return render(
        <MemoryRouter
            initialEntries={["/nights/night123"]}
        >
            <Routes>
                <Route
                    path="/nights/:id"
                    element={<NightRoomPage />}
                />

                <Route
                    path="/nights/:id/results"
                    element={<h1>Results Page</h1>}
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();

    getNight.mockResolvedValue(room);

    searchNightMovies.mockResolvedValue({
        results: []
    });
});

test("loads the real night with populated members", async () => {
    renderRoom();

    expect(
        await screen.findByRole("heading", {
            name: "Friday Movie Night"
        })
    ).toBeInTheDocument();

    expect(
        screen.getByText("ABC123")
    ).toBeInTheDocument();

    expect(
        screen.getByText("Bob")
    ).toBeInTheDocument();

    expect(getNight).toHaveBeenCalledWith(
        "night123",
        expect.objectContaining({
            signal: expect.any(AbortSignal)
        })
    );
});

test("sends a TMDB ID to Express when suggesting a movie", async () => {
    searchNightMovies.mockResolvedValue({
        results: [
            {
                tmdbId: 123,
                title: "Example Film",
                posterPath: null,
                releaseDate: "2024-01-01",
                voteAverage: 8
            }
        ]
    });

    getNightMovie.mockResolvedValue({
        tmdbId: 123,
        title: "Example Film",
        runtime: 90
    });

    addNightSuggestion.mockResolvedValue({
        _id: "sug1"
    });

    renderRoom();

    await screen.findByRole("heading", {
        name: "Friday Movie Night"
    });

    fireEvent.change(
        screen.getByRole("searchbox"),
        {
            target: { value: "Example" }
        }
    );

    fireEvent.click(
        screen.getByRole("button", {
            name: "Search"
        })
    );

    await screen.findByRole("button", {
        name: "Suggest Movie"
    });

    fireEvent.click(
        screen.getByRole("button", {
            name: "Suggest Movie"
        })
    );

    await waitFor(() => {
        expect(
            addNightSuggestion
        ).toHaveBeenCalledWith("night123", 123);
    });
});

test("allows removing a stored suggestion", async () => {
    getNight.mockResolvedValue({
        ...room,
        suggestions: [
            {
                _id: "sug1",
                tmdbId: 123,
                title: "Example Film",
                posterPath: null,
                runtime: 90,
                voteAverage: 8,
                addedBy: {
                    _id: "userA",
                    displayName: "Alice"
                }
            }
        ]
    });

    removeNightSuggestion.mockResolvedValue(null);

    renderRoom();

    await screen.findByRole("heading", {
        name: "Example Film"
    });

    fireEvent.click(
        screen.getByRole("button", {
            name: "Remove"
        })
    );

    await waitFor(() => {
        expect(
            removeNightSuggestion
        ).toHaveBeenCalledWith(
            "night123",
            "sug1"
        );
    });
});



test("host can close voting and is taken to the results", async () => {
    getNight.mockResolvedValue({
        ...room,
        ballotsCast: 2
    });

    closeNightVoting.mockResolvedValue({
        ...room,
        status: "closed"
    });

    renderRoom();

    // Open the confirmation dialog.
    fireEvent.click(
        await screen.findByRole("button", {
            name: "Close Voting & Show Results"
        })
    );

    // Verify that the confirmation dialog opens.
    const dialog = await screen.findByRole("dialog", {
        name: "Close Voting?"
    });

    expect(dialog).toHaveAttribute("open");

    // Voting must remain open until the host confirms.
    expect(closeNightVoting).not.toHaveBeenCalled();

    // Confirm the action inside the dialog.
    fireEvent.click(
        within(dialog).getByRole("button", {
            name: "Close Voting & Show Results"
        })
    );

    await waitFor(() => {
        expect(closeNightVoting).toHaveBeenCalledWith("night123");
    });

    expect(
        await screen.findByRole("heading", {
            name: "Results Page"
        })
    ).toBeInTheDocument();
});

test("host can cancel closing voting", async () => {
    getNight.mockResolvedValue({
        ...room,
        ballotsCast: 2
    });

    renderRoom();

    fireEvent.click(
        await screen.findByRole("button", {
            name: "Close Voting & Show Results"
        })
    );

    const dialog = await screen.findByRole("dialog", {
        name: "Close Voting?"
    });

    fireEvent.click(
        within(dialog).getByRole("button", {
            name: "Cancel"
        })
    );

    expect(dialog).not.toHaveAttribute("open");

    expect(closeNightVoting).not.toHaveBeenCalled();

    expect(
        screen.getByRole("heading", {
            name: "Friday Movie Night"
        })
    ).toBeInTheDocument();
});


test("host cannot close voting before anyone has voted", async () => {
    renderRoom();

    expect(
        await screen.findByRole("button", {
            name: "Close Voting & Show Results"
        })
    ).toBeDisabled();
});

test("members do not see the close voting button", async () => {
    getNight.mockResolvedValue({
        ...room,
        isOwner: false,
        ballotsCast: 2
    });

    renderRoom();

    await screen.findByRole("heading", {
        name: "Friday Movie Night"
    });

    expect(
        screen.queryByRole("button", {
            name: "Close Voting & Show Results"
        })
    ).not.toBeInTheDocument();
});

test("a closed night links to the final results", async () => {
    getNight.mockResolvedValue({
        ...room,
        status: "closed"
    });

    renderRoom();

    expect(
        await screen.findByRole("link", {
            name: "View Final Results"
        })
    ).toHaveAttribute("href", "/nights/night123/results");
});