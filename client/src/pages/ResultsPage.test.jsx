import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ResultsPage from "./ResultsPage";
import { getNight, getNightResult } from "../api/nights";

vi.mock("../api/nights", () => ({
    getNight: vi.fn(),
    getNightResult: vi.fn()
}));

const closedNight = {
    _id: "night123",
    title: "Friday Movie Night",
    status: "closed",
    updatedAt: "2026-11-20T20:00:00.000Z",
    members: [
        { _id: "userA", displayName: "Alice" },
        { _id: "userB", displayName: "Bob" }
    ],
    suggestions: []
};

const finalResult = {
    final: true,
    ballots: 2,
    winner: {
        id: "s1",
        tmdbId: 862,
        title: "Toy Story",
        posterPath: null,
        runtime: 81,
        voteAverage: 8,
        points: 5,
        status: "winner",
        reason: "Most points (5 pts)"
    },
    standings: [
        {
            id: "s1",
            tmdbId: 862,
            title: "Toy Story",
            posterPath: null,
            runtime: 81,
            voteAverage: 8,
            points: 5,
            status: "winner",
            reason: "Most points (5 pts)"
        },
        {
            id: "s2",
            tmdbId: 12,
            title: "Finding Nemo",
            posterPath: null,
            runtime: 100,
            voteAverage: 7.8,
            points: 4,
            status: "runner_up",
            reason: "4 pts vs the winner's 5 pts"
        },
        {
            id: "s3",
            tmdbId: 585,
            title: "Monsters, Inc.",
            posterPath: null,
            runtime: 92,
            voteAverage: 7.7,
            points: 3,
            status: "vetoed",
            reason: "Vetoed by 1 person"
        }
    ]
};

function renderResults() {
    return render(
        <MemoryRouter initialEntries={["/nights/night123/results"]}>
            <Routes>
                <Route
                    path="/nights/:id/results"
                    element={<ResultsPage />}
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    getNight.mockResolvedValue(closedNight);
    getNightResult.mockResolvedValue(finalResult);
});

test("shows the official winner, runners-up and exclusions", async () => {
    renderResults();

    expect(
        await screen.findByRole("heading", { name: "Toy Story" })
    ).toBeInTheDocument();

    expect(screen.getByText("2 of 2 members voted")).toBeInTheDocument();
    expect(screen.getByText("Most points (5 pts)")).toBeInTheDocument();

    expect(screen.getByText("Finding Nemo")).toBeInTheDocument();
    expect(screen.getByText("4 pts vs the winner's 5 pts")).toBeInTheDocument();

    expect(screen.getByText("Monsters, Inc.")).toBeInTheDocument();
    expect(screen.getByText("Vetoed by 1 person")).toBeInTheDocument();

    expect(getNightResult).toHaveBeenCalledWith(
        "night123",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
});

test("hides the result while voting is still open", async () => {
    getNight.mockResolvedValue({ ...closedNight, status: "open" });
    getNightResult.mockResolvedValue({ ...finalResult, final: false });

    renderResults();

    expect(
        await screen.findByText("Results Not Available Yet")
    ).toBeInTheDocument();

    expect(screen.queryByText("Toy Story")).not.toBeInTheDocument();
});

test("explains when every movie was vetoed", async () => {
    getNightResult.mockResolvedValue({
        final: true,
        ballots: 2,
        winner: null,
        standings: [finalResult.standings[2]]
    });

    renderResults();

    expect(
        await screen.findByRole("heading", { name: "No Winner" })
    ).toBeInTheDocument();
});

test("shows an error with a retry button when loading fails", async () => {
    getNightResult.mockRejectedValue(new Error("Night not found"));

    renderResults();

    expect(
        await screen.findByText("Night not found")
    ).toBeInTheDocument();

    expect(
        screen.getByRole("button", { name: "Retry" })
    ).toBeInTheDocument();
});