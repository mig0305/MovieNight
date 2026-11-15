import { NavLink, useNavigate } from "react-router-dom";
import popcorn from "../popcorn.png";

export function Navbar({ currentUser, onLogout }) {
    const navigate = useNavigate();

    function handleLogout() {
        onLogout();
        navigate("/");
    }

    return (
        <header className="site-header">

            <NavLink to="/" className="site-brand">
                <img src={popcorn} alt="" />
                <span>Movie Night</span>
                <img src={popcorn} alt="" />
            </NavLink>

            <nav className="site-nav">
                <NavLink to="/" end>
                    Discover
                </NavLink>

                {currentUser ? (
                    <>
                        <NavLink to="/nights">
                          My Nights
                        </NavLink>

                        <NavLink to="/watchlist">
                            Watchlist
                        </NavLink>

                        <NavLink to="/history">
                            History
                        </NavLink>

                        <span className="nav-username">
                            Hi, {currentUser.displayName}!
                        </span>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Log out
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login">
                            Log in
                        </NavLink>

                        <NavLink
                            to="/signup"
                            className="signup-link"
                        >
                            Sign up
                        </NavLink>
                    </>
                )}
            </nav>

        </header>
    );
}

