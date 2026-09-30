import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./GetApp.css";

const ANDROID_APK_URL = "/downloads/GuimarasGo.apk";
const ANDROID_QR_URL = "/QR/guimarasgo-android.png";
const IOS_QR_URL = "/QR/guimarasgo-ios.png";

const GUIMARASGO_WEB_URL =
    "https://iloilo-guimaras-ticketing-system-gules.vercel.app/";

const IOS_GET_APP_URL =
    "https://iloilo-guimaras-ticketing-system-gules.vercel.app/get-app?device=ios";

const detectDevice = () => {
    const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        window.opera ||
        "";

    if (/android/i.test(userAgent)) {
        return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "ios";
    }

    return "other";
};

const GetApp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const requestedDevice = searchParams.get("device");

    const [device, setDevice] = useState("other");

    useEffect(() => {
        const detectedDevice = detectDevice();

        setDevice(
            requestedDevice === "ios" || requestedDevice === "android"
                ? requestedDevice
                : detectedDevice
        );
    }, [requestedDevice]);

    useEffect(() => {
        if (requestedDevice === "ios") {
            const timer = setTimeout(() => {
                document
                    .getElementById("ios-install")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
            }, 120);

            return () => clearTimeout(timer);
        }
    }, [requestedDevice]);

    const deviceMessage = useMemo(() => {
        if (device === "android") {
            return "Your Android device is ready for GuimarasGo.";
        }

        if (device === "ios") {
            return "Your iPhone or iPad is ready for GuimarasGo.";
        }

        return "Choose the mobile device you want to use.";
    }, [device]);

    return (
        <main className="get-app-page">
            <div className="get-app-background" />

            <header className="get-app-header">
                <button
                    type="button"
                    className="get-app-back-button"
                    onClick={() => navigate("/")}
                >
                    ← Back
                </button>

                <div className="get-app-brand">
                    GuimarasGo
                </div>
            </header>

            <section className="get-app-card">
                <div className="get-app-hero">
                    <div className="get-app-logo" aria-hidden="true">
                        📱
                    </div>

                    <p className="get-app-eyebrow">
                        GUIMARASGO MOBILE
                    </p>

                    <h1>Get the App</h1>

                    <p className="get-app-device-message">
                        {deviceMessage}
                    </p>

                    <p className="get-app-subtitle">
                        Select your device below. Android uses the
                        GuimarasGo APK, while iPhone and iPad use
                        GuimarasGo as an installable web app.
                    </p>
                </div>

                <div className="device-options">

                    {/* ANDROID */}
                    <article
                        className={`device-card ${
                            device === "android"
                                ? "device-card-active"
                                : ""
                        }`}
                    >
                        <div className="device-card-top">
                            <div className="device-icon android-icon">
                                🤖
                            </div>

                            <div>
                                <span className="device-label">
                                    ANDROID APP
                                </span>

                                <h2>Android</h2>
                            </div>
                        </div>

                        <p className="device-description">
                            Download and install the GuimarasGo
                            Android application directly on your phone.
                        </p>

                        {/* THIS REMAINS THE ANDROID APK DOWNLOAD */}
                        <a
                            href={ANDROID_APK_URL}
                            className="device-primary-button"
                            download="GuimarasGo.apk"
                        >
                            Download Android APK
                        </a>

                        <div className="qr-divider">
                            <span>OR SCAN QR CODE</span>
                        </div>

                        <div className="qr-wrapper">
                            <img
                                src={ANDROID_QR_URL}
                                alt="GuimarasGo Android APK QR code"
                            />
                        </div>

                        <p className="qr-help">
                            Scan this QR code using your Android phone.
                        </p>
                    </article>

                    {/* IOS / PWA */}
                    <article
                        id="ios-install"
                        className={`device-card ${
                            device === "ios"
                                ? "device-card-active ios-selected"
                                : ""
                        }`}
                    >
                        <div className="device-card-top">
                            <div className="device-icon ios-icon">
                                🍎
                            </div>

                            <div>
                                <span className="device-label">
                                    IPHONE / IPAD
                                </span>

                                <h2>iPhone / iPad</h2>
                            </div>
                        </div>

                        <p className="device-description">
                            Open GuimarasGo directly in Safari and
                            install it on your Home Screen.
                        </p>

                        {/* IMPORTANT:
                            This no longer sends the user back to "/".
                            It opens the dedicated iOS installation route.
                        */}
                        <a
                            href="/get-app?device=ios"
                            className="device-primary-button"
                        >
                            Install on iPhone / iPad
                        </a>

                        <div className="qr-divider">
                            <span>OR SCAN QR CODE</span>
                        </div>

                        <div className="qr-wrapper">
                            <img
                                src={IOS_QR_URL}
                                alt="GuimarasGo iPhone and iPad installation QR code"
                            />
                        </div>

                        <p className="qr-help">
                            Scan this QR code to open the iOS installation
                            page directly.
                        </p>

                        <div className="ios-install-steps">
                            <div className="ios-step">
                                <span>1</span>
                                <p>
                                    Open the link in <strong>Safari</strong>.
                                </p>
                            </div>

                            <div className="ios-step">
                                <span>2</span>
                                <p>
                                    Tap <strong>Share</strong>.
                                </p>
                            </div>

                            <div className="ios-step">
                                <span>3</span>
                                <p>
                                    Select <strong>Add to Home Screen</strong>.
                                </p>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="ios-note">
                    <div className="ios-note-icon">
                        🍎
                    </div>

                    <div>
                        <strong>
                            iPhone / iPad installation
                        </strong>

                        <span>
                            No App Store is required. Safari installs
                            GuimarasGo as a Home Screen web app.
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="web-version-button"
                    onClick={() => navigate("/")}
                >
                    Continue to GuimarasGo Web
                </button>
            </section>
        </main>
    );
};

export default GetApp;
