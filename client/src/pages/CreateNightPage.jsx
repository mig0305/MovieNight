import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createNight } from "../api/nights";

export default function CreateNightPage() {
    const [title, setTitle] = useState("");
    const [maxRuntime, setMaxRuntime] = useState("120");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (submitting) return;

        setError("");

        const cleanTitle = title.trim();
        const minutes = Number(maxRuntime);

        if (
            cleanTitle.length < 1 ||
            cleanTitle.length > 80
        ) {
            setError(
                "Night title must contain 1 to 80 characters."
            );
            return;
        }

        if (
            !Number.isInteger(minutes) ||
            minutes < 30 ||
            minutes > 400
        ) {
            setError(
                "Runtime must be between 30 and 400 minutes."
            );
            return;
        }

        setSubmitting(true);

        try {
            const night = await createNight({
                title: cleanTitle,
                maxRuntimeMin: minutes
            });

            if (!night?._id) {
                throw new Error(
                    "The API did not return a valid night."
                );
            }

            navigate("/nights", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
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
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                        maxLength={80}
                        disabled={submitting}
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
                        onChange={(e) =>
                            setMaxRuntime(e.target.value)
                        }
                        min="30"
                        max="400"
                        step="1"
                        disabled={submitting}
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

                    <button
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Creating Night..."
                            : "Create Night"}
                    </button>
                </form>
            </div>
        </section>
    );
}

