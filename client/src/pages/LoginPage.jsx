import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage({ onAuthSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            setError("Please fill in all fields.");
            return;
        }

        // TEMPORARY: frontend-only login preview.
        // The backend will verify credentials later.
        onAuthSuccess({
            email: cleanEmail,
            displayName: cleanEmail.split("@")[0]
        });

        setPassword("");
        navigate("/");
    }

    return (
        <section className="auth-page">
            <div className="auth-card">

                <h1>Welcome Back</h1>

                <p className="auth-subtitle">
                    Log in to plan your next movie night.
                </p>

                <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
                    <label htmlFor="login-email">
                        Email
                    </label>

                    <input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="login-password">
                        Password
                    </label>

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit">
                        Log In 
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/signup">Sign up</Link>
                </p>

            </div>
        </section>
    );
}
