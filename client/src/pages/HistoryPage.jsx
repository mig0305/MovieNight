import { useState } from "react";
import { Link } from "react-router-dom";
import { NightCard } from "../components/NightCard";

export default function HistoryPage({ nights, currentUser }) {

    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    // Only completed nights belonging to this user
    const completedNights = nights.filter(
        (night) =>
            night.status === "completed" &&
            night.memberEmails.includes(currentUser.email) &&
            night.result?.winner
    );

    // Search by night title or winning movie
    const matchingNights = completedNights.filter((night) => {
        const query = search.trim().toLowerCase();

        const title = night.title.toLowerCase();
        const winner = night.result.winner.title.toLowerCase();

        return (
            title.includes(query) ||
            winner.includes(query)
        );
    });

    // Sort the matching results
    const sortedNights = matchingNights.sort((a, b) => {

        if (sortOrder === "newest") {
            return (
                new Date(b.finalizedAt) -
                new Date(a.finalizedAt)
            );
        }

        return (
            new Date(a.finalizedAt) -
            new Date(b.finalizedAt)
        );
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
                        onChange={(e) =>
                            setSortOrder(e.target.value)
                        }
                    >
                        <option value="newest">
                            Newest First
                        </option>

                        <option value="oldest">
                            Oldest First
                        </option>
                    </select>
                </div>

            </div>

            <h2>
                Completed Nights ({sortedNights.length})
            </h2>

            {sortedNights.length === 0 ? (

                <div className="night-empty">
                    <p>
                        {completedNights.length === 0
                            ? "You haven't completed any movie nights yet."
                            : "No completed nights match your search."}
                    </p>

                    <Link
                        to="/nights"
                        className="night-button"
                    >
                        My Nights
                    </Link>
                </div>

            ) : (

                <div className="night-grid">

                    {sortedNights.map((night) => (
                        <NightCard
                            key={night.id}
                            night={night}
                            currentUser={currentUser}
                        />
                    ))}

                </div>
            )}

        </section>
    );
}
