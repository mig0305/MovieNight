import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { joinNight } from "../api/nights";

export default function JoinNightPage() {
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (submitting) return;

        setError("");

        const code = joinCode.trim().toUpperCase();

        if (!/^[A-Z0-9]{6}$/.test(code)) {
            setError(
                "Please enter a valid 6-character join code."
            );
            return;
        }

        setSubmitting(true);

        try {
            const night = await joinNight(code);

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
                <h1>Join a Movie Night</h1>

                <p className="night-description">
                    Ask your friend for their invitation code
                    to join their movie night.
                </p>

                <form
                    className="night-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="join-code">
                        Invitation Code
                    </label>

                    <input
                        id="join-code"
                        className="join-code-input"
                        type="text"
                        placeholder="e.g. ABC123"
                        value={joinCode}
                        onChange={(e) =>
                            setJoinCode(
                                e.target.value.toUpperCase()
                            )
                        }
                        maxLength={6}
                        disabled={submitting}
                        required
                    />

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
                            ? "Joining Night..."
                            : "Join Night"}
                    </button>
                </form>
            </div>
        </section>
    );
}
