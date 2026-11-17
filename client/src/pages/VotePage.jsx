import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import LoadingIndicator from "../components/LoadingIndicator";
import { getNight, saveNightBallot } from "../api/nights";

const EMPTY_CHOICES = {
    first: "",
    second: "",
    third: "",
    veto: ""
};

export default function VotePage() {
    const { id } = useParams();

    const [night, setNight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [choices, setChoices] = useState(EMPTY_CHOICES);
    const [hasSavedBallot, setHasSavedBallot] = useState(false);
    const [needsRevote, setNeedsRevote] = useState(false);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    // Load suggestions and this user's existing ballot.
    useEffect(() => {
        const controller = new AbortController();

        async function loadVoting() {
            setLoading(true);
            setLoadError("");
            setMessage("");
            setNight(null);

            try {
                const data = await getNight(id, {
                    signal: controller.signal
                });

                if (
                    !data?._id ||
                    !Array.isArray(data.suggestions)
                ) {
                    throw new Error(
                        "The API returned invalid voting data."
                    );
                }

                if (controller.signal.aborted) return;

                const validIds = new Set(
                    data.suggestions.map(
                        (movie) => String(movie._id)
                    )
                );

                const ballot = data.myBallot ?? {
                    ranking: [],
                    veto: null
                };

                // MongoDB ObjectIds arrive as strings in JSON.
                const ranking = (
                    Array.isArray(ballot.ranking)
                        ? ballot.ranking
                        : []
                )
                    .map((value) =>
                        String(value?._id ?? value)
                    )
                    .filter((value) => validIds.has(value))
                    .slice(0, 3);

                const vetoId = ballot.veto
                    ? String(
                        ballot.veto?._id ?? ballot.veto
                    )
                    : "";

                setChoices({
                    first: ranking[0] ?? "",
                    second: ranking[1] ?? "",
                    third: ranking[2] ?? "",
                    veto:
                        validIds.has(vetoId) &&
                        !ranking.includes(vetoId)
                            ? vetoId
                            : ""
                });

                const saved = Boolean(ballot._id);

                setHasSavedBallot(
                    saved && ranking.length === 3
                );

                setNeedsRevote(
                    saved && ranking.length !== 3
                );

                setNight(data);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLoadError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadVoting();

        return () => controller.abort();
    }, [id, reloadKey]);

    function changeRank(field, value) {
        const clearedOwnVeto =
            value !== "" && choices.veto === value;

        setChoices((previous) => ({
            ...previous,
            [field]: value,
            veto:
                previous.veto === value
                    ? ""
                    : previous.veto
        }));

        if (clearedOwnVeto) {
            setMessage(
                "Your veto was cleared because you ranked that movie."
            );
        } else {
            setMessage("");
        }

        setIsError(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving || !night) return;

        setMessage("");
        setIsError(false);

        const ranking = [
            choices.first,
            choices.second,
            choices.third
        ];

        const validIds = new Set(
            night.suggestions.map(
                (movie) => String(movie._id)
            )
        );

        if (night.status !== "open") {
            setMessage("Voting is closed for this night.");
            setIsError(true);
            return;
        }

        // Validate exactly three different suggestions.
        if (
            ranking.some((value) => !validIds.has(value)) ||
            new Set(ranking).size !== 3
        ) {
            setMessage(
                "Choose three different suggested movies."
            );
            setIsError(true);
            return;
        }

        // Veto is optional, but cannot overlap rankings.
        if (
            choices.veto &&
            (
                !validIds.has(choices.veto) ||
                ranking.includes(choices.veto)
            )
        ) {
            setMessage(
                "Your veto must be a movie outside your top three."
            );
            setIsError(true);
            return;
        }

        setSaving(true);

        try {
            const ballot = await saveNightBallot(id, {
                ranking,
                veto: choices.veto || null
            });

            if (
                !ballot?._id ||
                !Array.isArray(ballot.ranking)
            ) {
                throw new Error(
                    "The API returned an invalid saved ballot."
                );
            }

            setHasSavedBallot(true);
            setNeedsRevote(false);

            setMessage(
                "Your vote was saved successfully. " +
                "You can update it until voting closes."
            );

            setIsError(false);
        } catch (error) {
            setMessage(error.message);
            setIsError(true);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <LoadingIndicator
                text="Loading voting choices..."
            />
        );
    }

    if (loadError || !night) {
        return (
            <section className="vote-page">
                <Link
                    to="/nights"
                    className="back-link"
                >
                    ← Back to My Nights
                </Link>

                <h1>Unable to load voting</h1>

                <p
                    className="vote-message error"
                    role="alert"
                >
                    {loadError || "Movie night not found."}
                </p>

                <button
                    type="button"
                    className="night-button secondary"
                    onClick={() =>
                        setReloadKey((value) => value + 1)
                    }
                >
                    Retry
                </button>
            </section>
        );
    }

    if (night.status !== "open") {
        return (
            <section className="vote-page">
                <h1>Voting Is Closed</h1>

                <p>
                    This movie night is closed.
                    Final results will be connected in
                    Milestone 6.
                </p>

                <Link
                    to={`/nights/${id}`}
                    className="back-link"
                >
                    ← Back to Night Room
                </Link>
            </section>
        );
    }

    if (night.suggestions.length < 3) {
        return (
            <section className="vote-page">
                <h1>Not enough movies yet</h1>

                <p>
                    At least three suggested movies are
                    needed to rank your top three.
                </p>

                <Link
                    to={`/nights/${id}`}
                    className="back-link"
                >
                    ← Back to Night Room
                </Link>
            </section>
        );
    }

    const rankedIds = [
        choices.first,
        choices.second,
        choices.third
    ];

    // Veto dropdown excludes the movies already ranked.
    const availableVetoes = night.suggestions.filter(
        (movie) =>
            !rankedIds.includes(String(movie._id))
    );

    return (
        <section className="vote-page">
            <Link
                to={`/nights/${id}`}
                className="back-link"
            >
                ← Back to Night Room
            </Link>

            <div className="vote-header">
                <h1>Cast Your Vote</h1>
                <p>{night.title}</p>
            </div>

            <div className="vote-card">
                <h2>Rank Your Top Three</h2>

                <p className="vote-description">
                    Choose three different movies.
                    First place earns 3 points,
                    second earns 2 points,
                    and third earns 1 point.
                </p>

                {hasSavedBallot && (
                    <p className="vote-notice">
                        You already have a saved ballot.
                        Saving again replaces it.
                    </p>
                )}

                {needsRevote && (
                    <p className="vote-notice">
                        Your earlier ballot needs updating
                        because a movie is no longer available.
                    </p>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="vote-form"
                >
                    {[
                        [
                            "first",
                            "1st Place — 3 points",
                            "Select your favorite movie"
                        ],
                        [
                            "second",
                            "2nd Place — 2 points",
                            "Select your second choice"
                        ],
                        [
                            "third",
                            "3rd Place — 1 point",
                            "Select your third choice"
                        ]
                    ].map(([field, label, placeholder]) => (
                        <div
                            className="vote-choice"
                            key={field}
                        >
                            <label htmlFor={`${field}-choice`}>
                                {label}
                            </label>

                            <select
                                id={`${field}-choice`}
                                value={choices[field]}
                                onChange={(event) =>
                                    changeRank(
                                        field,
                                        event.target.value
                                    )
                                }
                                required
                                disabled={saving}
                            >
                                <option value="">
                                    {placeholder}
                                </option>

                                {night.suggestions.map((movie) => (
                                    <option
                                        key={movie._id}
                                        value={movie._id}
                                    >
                                        {movie.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}

                    <div className="vote-choice veto-choice">
                        <label htmlFor="veto-choice">
                            Your Veto — Maximum 1 Movie
                        </label>

                        <p className="vote-description">
                            You may veto one movie outside your own top
                            three. If any member vetoes a movie, that
                            movie cannot win, even if other members
                            ranked it.
                        </p>

                        <select
                            id="veto-choice"
                            value={choices.veto}
                            onChange={(event) => {
                                setChoices((previous) => ({
                                    ...previous,
                                    veto: event.target.value
                                }));
                                setMessage("");
                            }}
                            disabled={saving}
                        >
                            <option value="">
                                No veto
                            </option>

                            {availableVetoes.map((movie) => (
                                <option
                                    key={movie._id}
                                    value={movie._id}
                                >
                                    {movie.title}
                                </option>
                            ))}
                        </select>

                        {night.suggestions.length === 3 && (
                            <p className="vote-description">
                                A fourth suggestion is needed
                                to veto outside your top three.
                            </p>
                        )}
                    </div>

                    {message && (
                        <p
                            className={
                                `vote-message ${
                                    isError ? "error" : "success"
                                }`
                            }
                            role={isError ? "alert" : "status"}
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="vote-submit"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving Vote..."
                            : hasSavedBallot
                                ? "Update My Vote"
                                : "Submit My Vote"}
                    </button>
                </form>
            </div>

            <button
                type="button"
                className="night-button secondary"
                onClick={() =>
                    setReloadKey((value) => value + 1)
                }
                disabled={saving}
            >
                Reload voting choices
            </button>
        </section>
    );
}

