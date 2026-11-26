export default function LoadingIndicator({
    text = "Loading..."
}) {
    return (
        <div
            className="loading-indicator"
            role="status"
            aria-live="polite"
        >
            <div className="loading-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <p>{text}</p>
        </div>
    );
}
