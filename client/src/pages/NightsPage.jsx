import { Link } from "react-router-dom";
import { NightCard } from "../components/NightCard";

export default function NightsPage({ nights, currentUser }) {

    // Only show nights this user belongs to
    const myNights = nights.filter((night) =>
        night.memberEmails.includes(currentUser.email)
    );

    // Separate active and completed nights
    const activeNights = myNights.filter(
        (night) => night.status === "active"
    );
        
    const pastNights = myNights
        .filter((night) => night.status === "completed")
        .sort(
            (a, b) =>
                new Date(b.finalizedAt) - new Date(a.finalizedAt)
        );

    return (
        <section className="nights-page">

            <div className="nights-header">
                <div>
                    <h1>My Nights</h1>
                    <p>
                        Plan your next movie night and manage your groups.
                    </p>
                </div>

                <div className="night-actions">
                    <Link to="/nights/new" className="night-button">
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

            <div className="night-section">
                <h2>Active Nights ({activeNights.length})</h2>

                {activeNights.length === 0 ? (
                    <div className="night-empty">
                        <p>You don't have any active movie nights yet.</p>
                        <p>
                            Create a night or join your friends
                            using their invitation code.
                        </p>
                    </div>
                ) : (
                    <div className="night-grid">
                        {activeNights.map((night) => (
                            <NightCard
                                key={night.id}
                                night={night}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="night-section">
                <h2>Past Nights ({pastNights.length})</h2>

                <Link to="/history" className="history-link">
                    Browse Complete History
                </Link>

                {pastNights.length === 0 ? (
                    <div className="night-empty">
                        <p>
                            No completed movie nights yet.
                        </p>
                    </div>
                ) : (
                    <div className="night-grid">
                        {pastNights.map((night) => (
                            <NightCard
                                key={night.id}
                                night={night}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>

        </section>
    );
}
