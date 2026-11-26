import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import LoadingIndicator from "../components/LoadingIndicator";
import { useAuth } from "../auth/useAuth";
import { getMyNights, getNightResult } from "../api/nights";

export default function HistoryPage() {
    const { currentUser } = useAuth();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    // Load my closed nights, then each night's official winner.
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        async function loadHistory() {
            setLoading(true);
            setError("");

            try {
                const nights = await getMyNights({ signal });

                if (!Array.isArray(nights)) {
                    throw new Error(
                        "The API returned an invalid list of nights."
                    );
                }

                const closedNights = nights.filter(
                    (night) => night.status === "closed"
                );

                // One result request per closed night, in parallel.
                // If one fails, the others are still shown.
                const results = await Promise.allSettled(
                    closedNights.map((night) =>
                        getNightResult(night._id, { signal })
                    )
                );

                const entries = closedNights.map((night, index) => {
                    const outcome = results[index];

                    return {
                        night,
                        winner:
                            outcome.status === "fulfilled"
                                ? outcome.value.winner
                                : null,
                        ballots:
                            outcome.status === "fulfilled"
                                ? outcome.value.ballots
                                : null,
                        resultFailed: outcome.status === "rejected"
                    };
                });

                if (!signal.aborted) {
                    setHistory(entries);
                }
            } catch (err) {
                if (!signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadHistory();

        return () => controller.abort();
    }, [reloadKey]);

    if (loading) {
        return <LoadingIndicator text="Loading your history..." />;
    }

    if (error) {
        return (
            <section className="history-page">
                <Link to="/nights" className="back-link">
                    ← Back to My Nights
                </Link>

                <h1>Unable to load history</h1>

                <p className="room-message error" role="alert">
                    {error}
                </p>

                <button
                    type="button"
                    className="night-button secondary"
                    onClick={() => setReloadKey((value) => value + 1)}
                >
                    Retry
                </button>
            </section>
        );
    }

    // Search by night title or winning movie
    const query = search.trim().toLowerCase();

    const matching = history.filter(({ night, winner }) =>
        night.title.toLowerCase().includes(query) ||
        (winner?.title ?? "").toLowerCase().includes(query)
    );

    // A closed night can't change, so updatedAt is when voting closed
    const sorted = [...matching].sort((a, b) => {
        const difference =
            new Date(b.night.updatedAt) - new Date(a.night.updatedAt);

        return sortOrder === "newest" ? difference : -difference;
    });

    return (
        <section className="history-page">

            <Link to="/nights" className="back-link">
                ← Back to My Nights
            </Link>

            <div className="history-header">
                <h1>Movie Night History</h1>

                <p>
                    Revisit your completed movie nights,
                    winning movies, and group results.
                </p>
            </div>

            <div className="history-controls">

                <div>
                    <label htmlFor="history-search">
                        Search History
                    </label>

                    <input
                        id="history-search"
                        type="search"
                        placeholder="Search by night or movie..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="history-sort">
                        Sort By
                    </label>

                    <select
                        id="history-sort"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>

            </div>

            <h2>Completed Nights ({sorted.length})</h2>

            {sorted.length === 0 ? (

                <div className="night-empty">
                    <p>
                        {history.length === 0
                            ? "You haven't completed any movie nights yet."
                            : "No completed nights match your search."}
                    </p>

                    <Link to="/nights" className="night-button">
                        My Nights
                    </Link>
                </div>

            ) : (

                <div className="night-grid">

                    {sorted.map(({ night, winner, ballots, resultFailed }) => {
                        const ownerId = night.owner?._id ?? night.owner;

                        const isOwner =
                            String(ownerId) === String(currentUser.id);

                        const memberCount = Array.isArray(night.members)
                            ? night.members.length
                            : 0;

                        return (
                            <article className="night-card" key={night._id}>
                                <div className="night-card-header">
                                    <h3>{night.title}</h3>

                                    <span className="night-status completed">
                                        Closed
                                    </span>
                                </div>

                                <p className="night-role">
                                    {isOwner
                                        ? "You were the host"
                                        : "You were a member"}
                                </p>

                                <div className="night-info">
                                    <p>
                                        Winner:
                                        <strong>
                                            {" "}
                                            {resultFailed
                                                ? "Result unavailable"
                                                : winner
                                                    ? winner.title
                                                    : "No winner"}
                                        </strong>
                                    </p>

                                    {winner && (
                                        <p>
                                            Points:
                                            <strong> {winner.points}</strong>
                                        </p>
                                    )}

                                    {ballots !== null && (
                                        <p>
                                            Ballots:
                                            <strong>
                                                {" "}{ballots} of {memberCount}
                                            </strong>
                                        </p>
                                    )}

                                    <p>
                                        Closed on:
                                        <strong>
                                            {" "}
                                            {new Date(
                                                night.updatedAt
                                            ).toLocaleDateString()}
                                        </strong>
                                    </p>
                                </div>

                                <Link
                                    to={`/nights/${night._id}/results`}
                                    className="night-button room-button"
                                >
                                    View Results
                                </Link>
                            </article>
                        );
                    })}

                </div>
            )}

        </section>
    );
}