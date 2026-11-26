import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { NightCard } from "../components/NightCard";
import LoadingIndicator from "../components/LoadingIndicator";
import { getMyNights } from "../api/nights";

export default function NightsPage({ currentUser }) {
    const [nights, setNights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadNights() {
            setLoading(true);
            setError("");

            try {
                const data = await getMyNights({
                    signal: controller.signal
                });

                if (!Array.isArray(data)) {
                    throw new Error(
                        "The API returned an invalid nights list."
                    );
                }

                if (!controller.signal.aborted) {
                    setNights(data);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadNights();

        return () => controller.abort();
    }, [currentUser.id, retryKey]);

    const activeNights = nights.filter(
        (night) => night.status === "open"
    );

    const pastNights = nights.filter(
        (night) => night.status === "closed"
    );

    return (
        <section className="nights-page">
            <div className="nights-header">
                <div>
                    <h1>My Nights</h1>
                    <p>
                        Plan your next movie night and manage
                        your groups.
                    </p>
                </div>

                <div className="night-actions">
                    <Link
                        to="/nights/new"
                        className="night-button"
                    >
                        + Create Night
                    </Link>

                    <Link
                        to="/nights/join"
                        className="night-button secondary"
                    >
                        Join Night
                    </Link>
                </div>
            </div>

            {loading ? (
                <LoadingIndicator
                    text="Loading your movie nights..."
                />
            ) : error ? (
                <div className="night-empty">
                    <p role="alert">{error}</p>

                    <button
                        type="button"
                        onClick={() =>
                            setRetryKey((value) => value + 1)
                        }
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="night-section">
                        <h2>
                            Active Nights ({activeNights.length})
                        </h2>

                        {activeNights.length === 0 ? (
                            <div className="night-empty">
                                <p>
                                    You don't have any active
                                    movie nights yet.
                                </p>
                                <p>
                                    Create a night or join your
                                    friends using their
                                    invitation code.
                                </p>
                            </div>
                        ) : (
                            <div className="night-grid">
                                {activeNights.map((night) => (
                                    <NightCard
                                        key={night._id}
                                        night={night}
                                        currentUser={currentUser}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="night-section">
                        <h2>
                            Past Nights ({pastNights.length})
                        </h2>

                        {pastNights.length === 0 ? (
                            <div className="night-empty">
                                <p>
                                    No closed movie nights yet.
                                </p>
                            </div>
                        ) : (
                            <div className="night-grid">
                                {pastNights.map((night) => (
                                    <NightCard
                                        key={night._id}
                                        night={night}
                                        currentUser={currentUser}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
