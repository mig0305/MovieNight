import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function SignupPage() {
    const [form, setForm] = useState({
        displayName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (loading) return;

        setError("");

        const displayName = form.displayName.trim();
        const email = form.email.trim().toLowerCase();

        if (!displayName || displayName.length > 40) {
            setError(
                "Name must contain between 1 and 40 characters."
            );
            return;
        }

        if (!email || email.length > 200) {
            setError("Please enter a valid email.");
            return;
        }

        if (
            form.password.length < 8 ||
            form.password.length > 72
        ) {
            setError(
                "Password must contain between 8 and 72 characters."
            );
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await signup(
                displayName,
                email,
                form.password
            );

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
                <h1>Join Movie Night</h1>

                <p className="auth-subtitle">
                    Create your profile and start planning movie nights.
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="signup-name">
                        Display Name
                    </label>

                    <input
                        id="signup-name"
                        type="text"
                        name="displayName"
                        autoComplete="nickname"
                        placeholder="Your name"
                        value={form.displayName}
                        onChange={handleChange}
                        maxLength={40}
                        disabled={loading}
                        required
                    />

                    <label htmlFor="signup-email">
                        Email
                    </label>

                    <input
                        id="signup-email"
                        type="email"
                        name="email"
                        autoComplete="username"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        maxLength={200}
                        disabled={loading}
                        required
                    />

                    <label htmlFor="signup-password">
                        Password
                    </label>

                    <input
                        id="signup-password"
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        maxLength={72}
                        disabled={loading}
                        required
                    />

                    <label htmlFor="signup-confirm">
                        Confirm Password
                    </label>

                    <input
                        id="signup-confirm"
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        maxLength={72}
                        disabled={loading}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login">Log in</Link>
                </p>
            </div>
        </section>
    );
}