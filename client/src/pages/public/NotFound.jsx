import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeContent: "center",
                gap: 12,
                padding: 24,
                color: "#18302d",
                background: "#f8f6f1",
                fontFamily: "Arial, sans-serif",
                textAlign: "center"
            }}
        >
            <p>ERROR 404</p>
            <h1>This page could not be found</h1>
            <p>Check the address or return to the GuimarasGo home page.</p>
            <Link to="/">Go to home</Link>
        </main>
    );
}
