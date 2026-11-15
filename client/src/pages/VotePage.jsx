import { useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function VotePage( {nights,suggestions,votes,currentUser,onSaveVote} ) {
    const { id } = useParams();

    const night = nights.find((n) => n.id === id);

    const nightSuggestions = suggestions.filter(
        (s) => s.nightId === id
    );

    // Find the current user's previously saved ballot
    const savedVote = votes.find(
        (v) =>
            v.nightId === id &&
            v.userEmail === currentUser.email
    );

    // Three ranking choices
    const [first, setFirst] = useState(
        savedVote?.rankedIds[0] || ""
    );

    const [second, setSecond] = useState(
        savedVote?.rankedIds[1] || ""
    );

    const [third, setThird] = useState(
        savedVote?.rankedIds[2] || ""
    );

    // One optional veto
    const [veto, setVeto] = useState(
        savedVote?.vetoId || ""
    );

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();

        const rankedIds = [first, second, third];

        const result = onSaveVote(id, rankedIds, veto);

        setMessage(result.message);
        setIsError(!result.success);
    }

    if (!night) {
        return (
            <section className="vote-page">
                <h1>Movie night not found</h1>
                <Link to="/nights">Back to My Nights</Link>
            </section>
        );
    }

    if (!night.memberEmails.includes(currentUser.email)) {
        return (
            <section className="vote-page">
                <h1>Access denied</h1>
                <p>You are not a member of this night.</p>
                <Link to="/nights">Back to My Nights</Link>
            </section>
        );
    }
    
    if (night.status !== "active") {
        return (
            <section className="vote-page">

                <h1>Voting is Closed</h1>

                <p>
                    This movie night has been finalized.
                    You can now see the winning movie.
                </p>

                <Link
                    to={`/nights/${id}/results`}
                    className="night-button"
                >
                    View Final Results
                </Link>

            </section>
        );
    }

    if (nightSuggestions.length < 3) {
        return (
            <section className="vote-page">
                <h1>Not enough movies yet</h1>
                <p>
                    At least three suggested movies are needed
                    before members can rank their top three.
                </p>
                <Link to={`/nights/${id}`} className="back-link">
                    Back to Night Room
                </Link>
            </section>
        );
    }

    return (
        <section className="vote-page">

            <Link to={`/nights/${id}`} className="back-link">
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

                {savedVote && (
                    <p className="vote-notice">
                        You have already submitted a ballot.
                        Saving again will replace your previous vote.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="vote-form">

                    <div className="vote-choice">
                        <label htmlFor="first-choice">
                            1st Place — 3 points
                        </label>

                        <select
                            id="first-choice"
                            value={first}
                            onChange={(e) => {
                                setFirst(e.target.value);
                                setMessage("");
                            }}
                            required
                        >
                            <option value="">
                                Select your favorite movie
                            </option>

                            {nightSuggestions.map((movie) => (
                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="vote-choice">
                        <label htmlFor="second-choice">
                            2nd Place — 2 points
                        </label>

                        <select
                            id="second-choice"
                            value={second}
                            onChange={(e) => {
                                setSecond(e.target.value);
                                setMessage("");
                            }}
                            required
                        >
                            <option value="">
                                Select your second choice
                            </option>

                            {nightSuggestions.map((movie) => (
                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="vote-choice">
                        <label htmlFor="third-choice">
                            3rd Place — 1 point
                        </label>

                        <select
                            id="third-choice"
                            value={third}
                            onChange={(e) => {
                                setThird(e.target.value);
                                setMessage("");
                            }}
                            required
                        >
                            <option value="">
                                Select your third choice
                            </option>

                            {nightSuggestions.map((movie) => (
                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="vote-choice veto-choice">
                        <label htmlFor="veto-choice">
                            Your Veto — Maximum 1 Movie
                        </label>

                        <p className="vote-description">
                            You may reject one movie outside your
                            top three. A vetoed movie cannot win.
                        </p>

                        <select
                            id="veto-choice"
                            value={veto}
                            onChange={(e) => {
                                setVeto(e.target.value);
                                setMessage("");
                            }}
                        >
                            <option value="">
                                No veto
                            </option>

                            {nightSuggestions.map((movie) => (
                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {message && (
                        <p
                            className={
                                isError
                                    ? "vote-message error"
                                    : "vote-message success"
                            }
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="vote-submit"
                    >
                        {savedVote
                            ? "Update My Vote"
                            : "Submit My Vote"}
                    </button>

                </form>
            </div>
        </section>
    );
}
