import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";

import { NightCard } from "./NightCard";

const exampleNight = {
    _id: "night123",
    title: "Friday Movie Night",
    owner: {
        _id: "userA",
        displayName: "Alice"
    },
    members: ["userA", "userB"],
    status: "open",
    maxRuntimeMin: 120,
    joinCode: "ABC123",
    createdAt: "2026-11-16T12:00:00.000Z"
};

test("shows the host and MongoDB night data", () => {
    // Arrange
    const currentUser = {
        id: "userA",
        displayName: "Alice"
    };

    // Act
    render(
        <MemoryRouter>
            <NightCard
                night={exampleNight}
                currentUser={currentUser}
            />
        </MemoryRouter>
    );

    // Assert
    expect(
        screen.getByText("You are the host")
    ).toBeInTheDocument();

    expect(
        screen.getByText("ABC123")
    ).toBeInTheDocument();

    expect(
        screen.getByRole("link", {
            name: "View Night"
        })
    ).toHaveAttribute(
        "href",
        "/nights/night123"
    );
});

test("shows member status for a non-host", () => {
    // Arrange
    const currentUser = {
        id: "userB",
        displayName: "Bob"
    };

    // Act
    render(
        <MemoryRouter>
            <NightCard
                night={exampleNight}
                currentUser={currentUser}
            />
        </MemoryRouter>
    );

    // Assert
    expect(
        screen.getByText("You are a member")
    ).toBeInTheDocument();
});

test("does not display an invitation code for closed nights", () => {
    // Arrange
    const closedNight = {
        ...exampleNight,
        status: "closed"
    };

    // Act
    render(
        <MemoryRouter>
            <NightCard
                night={closedNight}
                currentUser={{ id: "userA" }}
            />
        </MemoryRouter>
    );

    // Assert
    expect(
        screen.getByText("Closed")
    ).toBeInTheDocument();

    expect(
        screen.queryByText("ABC123")
    ).not.toBeInTheDocument();
});
