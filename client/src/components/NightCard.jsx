import { Link } from "react-router-dom";

export function NightCard({ night, currentUser }) {
    const isOwner = night.ownerEmail === currentUser.email;

    return (
        <article className="night-card">

            <div className="night-card-header">
                <h3>{night.title}</h3>

                <span className={`night-status ${night.status}`}>
                    {night.status === "active"
                        ? "Active"
                        : "Completed"}
                </span>
            </div>

            <p className="night-role">
                {isOwner ? "You are the host" : "You are a member"}
            </p>

            <div className="night-info">
                <p>
                    Maximum runtime:
                    <strong> {night.maxRuntimeMin} min</strong>
                </p>

                <p>
                    Members:
                    <strong> {night.memberEmails.length}</strong>
                </p>

                <p>
                    Created:
                    <strong>
                        {" "}
                        {new Date(night.createdAt).toLocaleDateString()}
                    </strong>
                </p>
            </div>

            {night.status === "active" && (
                <div className="night-code">
                    <span>Invite your friends with this code:</span>
                    <strong>{night.joinCode}</strong>
                </div>
            )}

            {/* WINNER PREVIEW FOR COMPLETED NIGHTS */}

            {night.status === "completed" && night.result?.winner && (
                <div className="night-winner-preview">

                    <span>WINNING MOVIE</span>

                    <strong>
                        {night.result.winner.title}
                    </strong>

                    <p>
                        {night.result.winner.points} points
                    </p>

                    <p>
                        Finalized:{" "}
                        {new Date(night.finalizedAt).toLocaleDateString()}
                    </p>

                </div>
            )}
  
            <Link
                to={
                    night.status === "active"
                        ? `/nights/${night.id}`
                        : `/nights/${night.id}/results`
                }
                className="night-button room-button"
            >
                {night.status === "active"
                    ? "Open Night Room"
                    : "View Results"}
            </Link>

        </article>
    );
}
