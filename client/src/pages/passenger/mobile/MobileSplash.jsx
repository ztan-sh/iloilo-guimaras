import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MobileSplash.css";

const SPLASH_SEEN_KEY = "ggo-splash-seen-v2";

export default function ClientSplash() {
    const navigate = useNavigate();
    const gesture = useRef(null);
    const finished = useRef(false);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);

    const goToLogin = () => {
        if (finished.current) return;
        finished.current = true;
        sessionStorage.setItem(SPLASH_SEEN_KEY, "true");
        setLoggingIn(true);
        window.setTimeout(() => {
            navigate("/login", { replace: true, state: { welcomeTransition: true } });
        }, 220);
    };

    const startSwipe = event => {
        if (event.target.closest?.("button") || revealed || loggingIn || finished.current) return;
        gesture.current = { pointerId: event.pointerId, startY: event.clientY };
        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const moveSwipe = event => {
        if (gesture.current?.pointerId !== event.pointerId) return;
        const offset = Math.min(0, event.clientY - gesture.current.startY);
        if (offset < 0) setDragging(true);
        setDragY(Math.max(offset, -window.innerHeight));
    };

    const endSwipe = event => {
        if (gesture.current?.pointerId !== event.pointerId) return;
        const offset = event.clientY - gesture.current.startY;
        gesture.current = null;
        setDragging(false);
        if (offset <= -Math.max(90, window.innerHeight * 0.16)) {
            setRevealed(true);
            setDragY(-window.innerHeight);
        } else {
            setDragY(0);
        }
    };

    const cancelSwipe = () => {
        gesture.current = null;
        setDragging(false);
        setDragY(0);
    };

    return (
        <main
            className={`ggo-splash${dragging ? " is-dragging" : ""}${revealed ? " is-revealed" : ""}${loggingIn ? " is-logging-in" : ""}`}
            onPointerDown={startSwipe}
            onPointerMove={moveSwipe}
            onPointerUp={endSwipe}
            onPointerCancel={cancelSwipe}
        >
            <svg className="ggo-splash-waves" viewBox="0 0 400 900" preserveAspectRatio="none" aria-hidden="true">
                <path fill="#f5d8b8" d="M0 338 C74 356 112 399 191 376 C272 353 319 327 400 360 V900 H0Z" />
                <path fill="#43a58d" d="M0 390 C66 432 123 436 194 398 C272 356 326 376 400 412 V900 H0Z" />
                <path fill="#f5b92a" d="M0 626 C79 653 133 675 209 643 C290 610 338 635 400 665 V900 H0Z" />
            </svg>

            <section className="ggo-splash-entry" aria-hidden={!revealed}>
                <div className="ggo-splash-entry-content">
                    <p>Ready for your next crossing?</p>
                    <button type="button" onClick={goToLogin}>Log in</button>
                </div>
            </section>

            <section
                className={`ggo-splash-curtain${dragging ? " is-dragging" : ""}`}
                style={{ "--ggo-splash-drag": `${dragY}px` }}
                aria-label="GuimarasGo welcome screen"
            >
                <img className="ggo-splash-logo" src="/images/guimarasgo-logo.png" alt="GuimarasGo" />
                <div className="ggo-splash-prompt" aria-hidden="true">
                    <span className="ggo-splash-arrow">⌃</span>
                    <span>Swipe up to reveal Log in</span>
                </div>
            </section>
        </main>
    );
}
