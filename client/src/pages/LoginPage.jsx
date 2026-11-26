import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (loading) return;

        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            await login(cleanEmail, password);
            setPassword("");
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth-page">
            <div className="auth-card">
                <h1>Welcome Back</h1>

                <p className="auth-subtitle">
                    Log in to plan your next movie night.
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="login-email">
                        Email
                    </label>

                    <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={200}
                        disabled={loading}
                        required
                    />

                    <label htmlFor="login-password">
                        Password
                    </label>

                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength={200}
                        disabled={loading}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
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
