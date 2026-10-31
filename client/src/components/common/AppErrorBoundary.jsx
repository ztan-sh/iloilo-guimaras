import React from "react";

export default class AppErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("Application rendering error:", error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <main
                role="alert"
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeContent: "center",
                    gap: 14,
                    padding: 24,
                    color: "#18302d",
                    background: "#f8f6f1",
                    fontFamily: "Arial, sans-serif",
                    textAlign: "center"
                }}
            >
                <h1>Something went wrong</h1>
                <p>Refresh the page and try again. If you are offline, reconnect to the internet first.</p>
                <button type="button" onClick={() => window.location.reload()}>
                    Refresh page
                </button>
                <a href="/">Return to GuimarasGo</a>
            </main>
        );
    }
}
