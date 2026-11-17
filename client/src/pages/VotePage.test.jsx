
import {
    beforeEach,
    expect,
    test,
    vi
} from "vitest";

import {
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";

import {
    MemoryRouter,
    Route,
    Routes
} from "react-router-dom";

import VotePage from "./VotePage";
import {
    getNight,
    saveNightBallot
} from "../api/nights";

vi.mock("../api/nights", () => ({
    getNight: vi.fn(),
    saveNightBallot: vi.fn()
}));

const ids = [
    "66f1c2e4b7a1d3f0c8e2a901",
    "66f1c2e4b7a1d3f0c8e2a902",
    "66f1c2e4b7a1d3f0c8e2a903",
    "66f1c2e4b7a1d3f0c8e2a904"
];

const baseNight = {
    _id: "66f1c2e4b7a1d3f0c8e2a905",
    title: "Friday Movie Night",
    status: "open",
    suggestions: ids.map((id, index) => ({
        _id: id,
        title: `Film ${index + 1}`
    })),
    myBallot: {
        ranking: [],
        veto: null
    }
};

function renderVote() {
    return render(
        <MemoryRouter
            initialEntries={[
                `/nights/${baseNight._id}/vote`
            ]}
        >
            <Routes>
                <Route
                    path="/nights/:id/vote"
                    element={<VotePage />}
                />
            </Routes>
        </MemoryRouter>
    );
}

async function selectTopThree() {
    await screen.findByRole("heading", {
        name: "Cast Your Vote"
    });

    fireEvent.change(
        screen.getByLabelText(/1st Place/),
        { target: { value: ids[0] } }
    );

    fireEvent.change(
        screen.getByLabelText(/2nd Place/),
        { target: { value: ids[1] } }
    );

    fireEvent.change(
        screen.getByLabelText(/3rd Place/),
        { target: { value: ids[2] } }
    );
}

beforeEach(() => {
    vi.clearAllMocks();

    getNight.mockResolvedValue(baseNight);

    saveNightBallot.mockResolvedValue({
        _id: "66f1c2e4b7a1d3f0c8e2a906",
        ranking: ids.slice(0, 3),
        veto: null
    });
});

test("loads suggestions from the night API", async () => {
    renderVote();

    await screen.findByRole("heading", {
        name: "Cast Your Vote"
    });

    expect(
        screen.getByLabelText(/1st Place/)
    ).toHaveTextContent("Film 1");

    expect(getNight).toHaveBeenCalledWith(
        baseNight._id,
        expect.objectContaining({
            signal: expect.any(AbortSignal)
        })
    );
});

test("submits three suggestion IDs and a veto", async () => {
    renderVote();

    await selectTopThree();

    fireEvent.change(
        screen.getByLabelText(/Your Veto/),
        { target: { value: ids[3] } }
    );

    fireEvent.click(
        screen.getByRole("button", {
            name: "Submit My Vote"
        })
    );

    await waitFor(() => {
        expect(
            saveNightBallot
        ).toHaveBeenCalledWith(
            baseNight._id,
            {
                ranking: ids.slice(0, 3),
                veto: ids[3]
            }
        );
    });
});

test("rejects repeated ranked choices", async () => {
    renderVote();

    await screen.findByRole("heading", {
        name: "Cast Your Vote"
    });

    fireEvent.change(
        screen.getByLabelText(/1st Place/),
        { target: { value: ids[0] } }
    );

    fireEvent.change(
        screen.getByLabelText(/2nd Place/),
        { target: { value: ids[0] } }
    );

    fireEvent.change(
        screen.getByLabelText(/3rd Place/),
        { target: { value: ids[2] } }
    );

    fireEvent.click(
        screen.getByRole("button", {
            name: "Submit My Vote"
        })
    );

    expect(
        await screen.findByRole("alert")
    ).toHaveTextContent(
        "Choose three different suggested movies."
    );

    expect(
        saveNightBallot
    ).not.toHaveBeenCalled();
});

test("restores an existing ballot", async () => {
    getNight.mockResolvedValue({
        ...baseNight,
        myBallot: {
            _id: "66f1c2e4b7a1d3f0c8e2a906",
            ranking: [ids[1], ids[0], ids[2]],
            veto: ids[3]
        }
    });

    renderVote();

    await screen.findByRole("heading", {
        name: "Cast Your Vote"
    });

    expect(
        screen.getByLabelText(/1st Place/)
    ).toHaveValue(ids[1]);

    expect(
        screen.getByLabelText(/Your Veto/)
    ).toHaveValue(ids[3]);

    expect(
        screen.getByRole("button", {
            name: "Update My Vote"
        })
    ).toBeInTheDocument();
});

test("prevents voting when the night is closed", async () => {
    getNight.mockResolvedValue({
        ...baseNight,
        status: "closed"
    });

    renderVote();

    expect(
        await screen.findByText("Voting Is Closed")
    ).toBeInTheDocument();

    expect(
        screen.queryByRole("button", {
            name: "Submit My Vote"
        })
    ).not.toBeInTheDocument();
});

test("ranking your own vetoed movie clears your veto", async () => {
    renderVote();

    await selectTopThree();

    fireEvent.change(
        screen.getByLabelText(/Your Veto/),
        { target: { value: ids[3] } }
    );

    expect(
        screen.getByLabelText(/Your Veto/)
    ).toHaveValue(ids[3]);

    fireEvent.change(
        screen.getByLabelText(/1st Place/),
        { target: { value: ids[3] } }
    );

    expect(
        screen.getByLabelText(/Your Veto/)
    ).toHaveValue("");

    expect(
        screen.getByRole("status")
    ).toHaveTextContent(
        "Your veto was cleared"
    );
});
