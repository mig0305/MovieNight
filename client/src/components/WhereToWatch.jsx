import { useState, useEffect } from "react";

import { getWatchProviders,IMAGE_BASE_URL } from "../api/tmdb";

import LoadingIndicator from "./LoadingIndicator";

export default function WhereToWatch({ movieId }) {

    const [region, setRegion] = useState("LB");
    const [providers, setProviders] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProviders() {
            setLoading(true);
            setError("");

            try {
                const data = await getWatchProviders(movieId);

                if (!cancelled) {
                    setProviders(data);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load watch providers.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProviders();

        return () => {
            cancelled = true;
        };
    }, [movieId]);

    // Get providers for the selected country
    const country = providers[region];

    const categories = [
        {
            title: "Stream with Subscription",
            items: country?.flatrate || []
        },
        {
            title: "Free or Ad-Supported",
            items: [
                ...(country?.free || []),
                ...(country?.ads || [])
            ]
        },
        {
            title: "Rent",
            items: country?.rent || []
        },
        {
            title: "Buy",
            items: country?.buy || []
        }
    ];

    const hasProviders = categories.some(
        (category) => category.items.length > 0
    );

    return (
        <section className="watch-providers">

            <div className="providers-header">
                <h2>Where to Watch</h2>

                <div className="region-select">
                    <label htmlFor="watch-region">
                        Country
                    </label>

                    <select
                        id="watch-region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    >
                        <option value="LB">Lebanon</option>
                        <option value="US">United States</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                    </select>
                </div>
            </div>
            
            {loading && (
                <LoadingIndicator
                    text="Checking streaming availability..."
                />
            )}

            {!loading && error && (
                <p className="error-message" role="alert">
                    {error}
                </p>
            )}

            {!loading && !error && !hasProviders && (
                <p className="providers-empty">
                    No streaming, rental, or purchase
                    information is currently listed for
                    this movie in the selected country.
                </p>
            )}

            {!loading && !error && hasProviders && (
                <>
                    {categories.map((category) => (

                        category.items.length > 0 && (

                            <div
                                className="provider-category"
                                key={category.title}
                            >
                                <h3>{category.title}</h3>

                                <div className="provider-list">

                                    {category.items.map((provider) => (
                                        <div
                                            className="provider-item"
                                            key={
                                                category.title +
                                                provider.provider_id
                                            }
                                        >

                                            {provider.logo_path && (
                                                <img
                                                    src={
                                                        IMAGE_BASE_URL +
                                                        provider.logo_path
                                                    }
                                                    alt=""
                                                    loading="lazy"
                                                />
                                            )}

                                            <span>
                                                {provider.provider_name}
                                            </span>

                                        </div>
                                    ))}

                                </div>
                            </div>

                        )
                    ))}

                    {country?.link && (
                        <a
                            href={country.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="provider-link"
                        >
                            Find Viewing Options on TMDB
                        </a>
                    )}
                </>
            )}

            <p className="provider-credit">
                Watch-provider information powered by{" "}
                <a
                    href="https://www.justwatch.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    JustWatch
                </a>
                {" "}via TMDB.
                Availability may change.
            </p>

        </section>
    );
}
