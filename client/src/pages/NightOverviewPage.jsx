import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getNight } from "../api/nights";
import LoadingIndicator from "../components/LoadingIndicator";

export default function NightOverviewPage() {
    const { id } = useParams();

    const [night, setNight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function loadNight() {
            setLoading(true);
            setError("");
            setNight(null);

            try {
                const data = await getNight(id, {
                    signal: controller.signal
                });

                if (!data?._id) {
                    throw new Error(
                        "The API returned an invalid night."
                    );
                }

                if (!controller.signal.aborted) {
                    setNight(data);
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

        loadNight();

        return () => controller.abort();
    }, [id, retryKey]);

    if (loading) {
        return (
            <LoadingIndicator
                text="Loading movie night..."
            />
        );
    }

    if (error) {
        return (
            <section className="night-room-page">
                <Link to="/nights" className="back-link">
                    ← Back to My Nights
                </Link>

                <h1>Unable to open movie night</h1>

                <p role="alert">{error}</p>

                <button
                    type="button"
                    onClick={() =>
                        setRetryKey((value) => value + 1)
                    }
                >
                    Retry
                </button>
            </section>
        );
    }

    const isOpen = night.status === "open";
    const ownerId = night.owner?._id ?? night.owner;

    return (
        <section className="night-room-page">
            <Link to="/nights" className="back-link">
                ← Back to My Nights
            </Link>

            <div className="room-header">
                <div>
                    <h1>{night.title}</h1>

                    <p>
                        {night.isOwner
                            ? "You are hosting this movie night."
                            : "You are a member of this movie night."}
                    </p>
                </div>

                <span
                    className={
                        `night-status ${
                            isOpen ? "active" : "completed"
                        }`
                    }
                >
                    {isOpen ? "Active" : "Closed"}
                </span>
            </div>

            <div className="room-stats">
                <div className="room-stat">
                    <span>Maximum runtime</span>
                    <strong>
                        {night.maxRuntimeMin} min
                    </strong>
                </div>

                <div className="room-stat">
                    <span>Members</span>
                    <strong>
                        {night.members.length}
                    </strong>
                </div>

                <div className="room-stat">
                    <span>Invitation code</span>
                    <strong>{night.joinCode}</strong>
                </div>
            </div>

            <div className="room-section">
                <h2>Group Members</h2>

                <div className="room-members">
                    {night.members.map((member) => (
                        <div
                            className="room-member"
                            key={member._id}
                        >
                            <span>
                                {member.displayName}
                            </span>

                            {String(member._id) ===
                                String(ownerId) && (
                                <strong>Host</strong>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="room-section">
                <h2>Movie Night Room</h2>

                <p className="room-hint">
                    This night's information and membership
                    are now saved in MongoDB.
                    Movie suggestions and voting will be
                    connected in the next integration milestones.
                </p>
            </div>
        </section>
    );
}
