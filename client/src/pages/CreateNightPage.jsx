import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CreateNightPage({ onCreateNight }) {
    const [title, setTitle] = useState("");
    const [maxRuntime, setMaxRuntime] = useState("120");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (title.trim().length < 2) {
            setError("Please enter a valid night title.");
            return;
        }

        const minutes = Number(maxRuntime);

        if (!Number.isInteger(minutes) || minutes <= 0) {
            setError("Runtime must be a positive whole number.");
            return;
        }

        onCreateNight({
            title: title.trim(),
            maxRuntimeMin: minutes
        });

        navigate("/nights");
    }

    return (
        <section className="night-form-page">

            <Link to="/nights" className="back-link">
                ← Back to My Nights
            </Link>

            <div className="night-form-card">

                <h1>Create a Movie Night</h1>

                <p className="night-description">
                    Set up a movie night and invite your friends
                    to choose a movie together.
                </p>

                <form
                    className="night-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="night-title">
                        Night Title
                    </label>

                    <input
                        id="night-title"
                        type="text"
                        placeholder="e.g. Friday Movie Night"
                        value={title}
                        autoComplete="off"
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={80}
                        required
                    />

                    <label htmlFor="night-runtime">
                        Maximum Movie Runtime (minutes)
                    </label>

                    <input
                        id="night-runtime"
                        type="number"
                        placeholder="e.g. 120"
                        value={maxRuntime}
                        onChange={(e) => setMaxRuntime(e.target.value)}
                        min="1"
                        step="1"
                        required
                    />

                    <p className="form-hint">
                        Movies longer than this limit will be
                        excluded from the final selection.
                    </p>

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit">
                        Create Night
                    </button>

                </form>
            </div>
        </section>
    );
}
