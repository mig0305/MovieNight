import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HistoryPage from "./HistoryPage";
import { getMyNights, getNightResult } from "../api/nights";

vi.mock("../auth/useAuth", () => ({
    useAuth: () => ({
        currentUser: { id: "userA", displayName: "Alice" }
    })
}));

vi.mock("../api/nights", () => ({
    getMyNights: vi.fn(),
    getNightResult: vi.fn()
}));

const nights = [
    {
        _id: "n1",
        title: "Friday Movie Night",
        status: "closed",
        owner: { _id: "userA", displayName: "Alice" },
        members: ["userA", "userB"],
        updatedAt: "2026-11-20T20:00:00.000Z"
    },
    {
        _id: "n2",
        title: "Saturday Horror",
        status: "closed",
        owner: { _id: "userB", displayName: "Bob" },
        members: ["userA", "userB"],
        updatedAt: "2026-11-21T20:00:00.000Z"
    },
    {
        _id: "n3",
        title: "Still Voting",
        status: "open",
        owner: { _id: "userA", displayName: "Alice" },
        members: ["userA"],
        updatedAt: "2026-11-22T20:00:00.000Z"
    }
];

function resultFor(id) {
    return id === "n1"
        ? { final: true, ballots: 2, winner: { title: "Finding Nemo", points: 5 } }
        : { final: true, ballots: 1, winner: { title: "The Ring", points: 3 } };
}

function renderHistory() {
    return render(
        <MemoryRouter>
            <HistoryPage />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    getMyNights.mockResolvedValue(nights);
    getNightResult.mockImplementation(async (id) => resultFor(id));
});

test("lists only closed nights with their official winners", async () => {
    renderHistory();

    expect(
        await screen.findByText("Completed Nights (2)")
    ).toBeInTheDocument();

    expect(screen.getByText("Friday Movie Night")).toBeInTheDocument();
    expect(screen.getByText(/Finding Nemo/)).toBeInTheDocument();
    expect(screen.getByText("Saturday Horror")).toBeInTheDocument();
    expect(screen.queryByText("Still Voting")).not.toBeInTheDocument();

    expect(getNightResult).toHaveBeenCalledTimes(2);
});

test("searches by winning movie", async () => {
    renderHistory();

    await screen.findByText("Completed Nights (2)");

    fireEvent.change(
        screen.getByLabelText("Search History"),
        { target: { value: "ring" } }
    );

    expect(screen.getByText("Completed Nights (1)")).toBeInTheDocument();
    expect(screen.getByText("Saturday Horror")).toBeInTheDocument();
    expect(screen.queryByText("Friday Movie Night")).not.toBeInTheDocument();
});

test("still shows a night whose result failed to load", async () => {
    getNightResult.mockImplementation(async (id) => {
        if (id === "n2") throw new Error("Server error");
        return resultFor(id);
    });

    renderHistory();

    expect(
        await screen.findByText(/Result unavailable/)
    ).toBeInTheDocument();

    expect(screen.getByText(/Finding Nemo/)).toBeInTheDocument();
});

test("shows an error with Retry when the nights can't load", async () => {
    getMyNights.mockRejectedValue(new Error("Cannot reach the API."));

    renderHistory();

    expect(
        await screen.findByText("Cannot reach the API.")
    ).toBeInTheDocument();

    expect(
        screen.getByRole("button", { name: "Retry" })
    ).toBeInTheDocument();
});