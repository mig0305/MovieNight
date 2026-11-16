import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./useAuth";
import {
    apiRequest,
    AUTH_EXPIRED_EVENT,
    TOKEN_KEY
} from "../api/backend";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        () => localStorage.getItem(TOKEN_KEY)
    );

    const [currentUser, setCurrentUser] = useState(null);

    const [authLoading, setAuthLoading] = useState(
        () => Boolean(localStorage.getItem(TOKEN_KEY))
    );

    const [authError, setAuthError] = useState("");

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCurrentUser(null);
        setAuthLoading(false);
        setAuthError("");
    }, []);

    // React to rejected authenticated API requests.
    useEffect(() => {
        function handleExpired(event) {
            const rejectedToken = event.detail?.token;

            // Ignore a response belonging to an older session.
            if (
                rejectedToken === token &&
                localStorage.getItem(TOKEN_KEY) === token
            ) {
                logout();
            }
        }

        window.addEventListener(
            AUTH_EXPIRED_EVENT,
            handleExpired
        );

        return () => {
            window.removeEventListener(
                AUTH_EXPIRED_EVENT,
                handleExpired
            );
        };
    }, [token, logout]);

    // Keep authentication synchronized between normal browser tabs.
    useEffect(() => {
        function handleStorage(event) {
            if (
                event.storageArea !== localStorage ||
                (event.key !== TOKEN_KEY && event.key !== null)
            ) {
                return;
            }

            const nextToken = localStorage.getItem(TOKEN_KEY);

            setCurrentUser(null);
            setAuthError("");
            setAuthLoading(Boolean(nextToken));
            setToken(nextToken);
        }

        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    // Verify a saved token and retrieve the actual user.
    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();

        async function restoreSession() {
            try {
                const data = await apiRequest("/auth/me", {
                    token,
                    signal: controller.signal
                });

                if (controller.signal.aborted) return;

                if (!data.user?.id) {
                    throw new Error(
                        "The API returned an invalid user response."
                    );
                }

                setCurrentUser(data.user);
                setAuthError("");
            } catch (error) {
                if (controller.signal.aborted) return;

                if (error.status === 401) {
                    // The API helper also announces this rejection.
                    // This check keeps restoration safe independently.
                    if (localStorage.getItem(TOKEN_KEY) === token) {
                        logout();
                    }
                } else {
                    setAuthError(
                        "Unable to verify your session. " +
                        "Check the backend connection, then retry."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setAuthLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            controller.abort();
        };
    }, [token, logout]);

    function saveSession(data) {
        if (
            typeof data.token !== "string" ||
            !data.token ||
            !data.user?.id
        ) {
            throw new Error(
                "The API returned an invalid authentication response."
            );
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setAuthLoading(false);
        setAuthError("");
    }

    async function login(email, password) {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            authenticated: false,
            body: { email, password }
        });

        saveSession(data);
    }

    async function signup(displayName, email, password) {
        const data = await apiRequest("/auth/signup", {
            method: "POST",
            authenticated: false,
            body: { displayName, email, password }
        });

        saveSession(data);
    }

    const value = {
        currentUser,
        token,
        authLoading,
        authError,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}