import { Link } from "react-router-dom";

export function NightCard({ night, currentUser }) {
    const ownerId = night.owner?._id ?? night.owner;

    const isOwner =
        String(ownerId) === String(currentUser.id);

    const isOpen = night.status === "open";

    const memberCount = Array.isArray(night.members)
        ? night.members.length
        : 0;

    return (
        <article className="night-card">
            <div className="night-card-header">
                <h3>{night.title}</h3>

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

            <p className="night-role">
                {isOwner
                    ? "You are the host"
                    : "You are a member"}
            </p>

            <div className="night-info">
                <p>
                    Maximum runtime:
                    <strong>
                        {" "}{night.maxRuntimeMin} min
                    </strong>
                </p>

                <p>
                    Members:
                    <strong> {memberCount}</strong>
                </p>

                <p>
                    Created:
                    <strong>
                        {" "}
                        {new Date(
                            night.createdAt
                        ).toLocaleDateString()}
                    </strong>
                </p>
            </div>

            {isOpen && (
                <div className="night-code">
                    <span>
                        Invite your friends with this code:
                    </span>
                    <strong>{night.joinCode}</strong>
                </div>
            )}

            <Link
                to={`/nights/${night._id}`}
                className="night-button room-button"
            >
                {isOpen
                    ? "View Night"
                    : "View Closed Night"}
            </Link>
        </article>
    );
}

