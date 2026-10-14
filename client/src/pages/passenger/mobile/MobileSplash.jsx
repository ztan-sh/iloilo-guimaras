
import React from "react";
import { useNavigate } from "react-router-dom";
import "./MobileSplash.css";

export default function ClientSplash() {
    const navigate = useNavigate();

    const finishSplash = () => {
        sessionStorage.setItem("ggo-splash-seen", "true");
        navigate("/login", { replace: true });
    };

    return (
        <main className="ggo-splash">
            <video
                className="ggo-splash-video"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={finishSplash}
                onError={finishSplash}
                aria-label="GuimarasGo introduction animation"
            >
                <source
                    src="/guimarasgo-intro.mp4"
                    type="video/mp4"
                />
            </video>

            <button
                type="button"
                className="ggo-splash-skip"
                onClick={finishSplash}
            >
                Skip intro
            </button>
        </main>
    );
}
