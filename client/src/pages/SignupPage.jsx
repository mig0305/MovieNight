import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage({ onAuthSuccess }) {
    const [form, setForm] = useState({
        displayName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");

    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;

        setForm({...form, [name]: value});
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (form.displayName.trim().length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (form.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // TEMPORARY: frontend-only signup preview.
        // No account is created yet.
        onAuthSuccess({
            displayName: form.displayName.trim(),
            email: form.email.trim().toLowerCase()
        });

        navigate("/");
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
                    autoComplete="off"
                >
                    <label htmlFor="signup-name">
                        Display Name
                    </label>

                    <input
                        id="signup-name"
                        type="text"
                        name="displayName"
                        placeholder="Your name"
                        value={form.displayName}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="signup-email">
                        Email
                    </label>

                    <input
                        id="signup-email"
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="signup-password">
                        Password
                    </label>

                    <input
                        id="signup-password"
                        type="password"
                        name="password"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />

                    <label htmlFor="signup-confirm">
                        Confirm Password
                    </label>

                    <input
                        id="signup-confirm"
                        type="password"
                        name="confirmPassword"
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit">
                        Sign Up 
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
