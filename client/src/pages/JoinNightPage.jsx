import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function JoinNightPage({ onJoinNight }) {
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const code = joinCode.trim().toUpperCase();

        if (code.length !== 6) {
            setError("Please enter a 6-character join code.");
            return;
        }

        const result = onJoinNight(code);

        if (!result.success) {
            setError(result.message);
            return;
        }

        navigate("/nights");
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
                            setJoinCode(e.target.value.toUpperCase())
                        }
                        maxLength={6}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit">
                        Join Night
                    </button>
                </form>

            </div>
        </section>
    );
}
