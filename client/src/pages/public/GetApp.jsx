import React from "react";
import { useNavigate } from "react-router-dom";
import "./GetApp.css";

const ANDROID_APK_URL = "/downloads/GuimarasGo.apk";
const ANDROID_QR_URL = "/QR/guimarasgo-android.png";

const GetApp = () => {
    const navigate = useNavigate();

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
                        Download the GuimarasGo Android App.
                    </p>

                    <p className="get-app-subtitle">
                        Get the Android application directly from
                        GuimarasGo and install it on your Android phone.
                    </p>
                </div>

                <article className="android-app-card">
                    <div className="android-card-header">
                        <div className="device-icon android-icon">
                            🤖
                        </div>

                        <div>
                            <span className="device-label">
                                ANDROID APP
                            </span>

                            <h2>GuimarasGo for Android</h2>
                        </div>
                    </div>

                    <div className="android-status">
                        <span className="status-dot" />
                        Android APK available
                    </div>

                    <p className="device-description">
                        Download the official GuimarasGo Android APK
                        directly to your device. No Google Play Store
                        account is required.
                    </p>

                    <a
                        href={ANDROID_APK_URL}
                        className="device-primary-button"
                        download="GuimarasGo.apk"
                    >
                        <span className="button-icon">↓</span>
                        Download Android APK
                    </a>

                    <div className="apk-details">
                        <div className="apk-detail">
                            <span>Platform</span>
                            <strong>Android</strong>
                        </div>

                        <div className="apk-detail">
                            <span>File</span>
                            <strong>GuimarasGo.apk</strong>
                        </div>

                        <div className="apk-detail">
                            <span>Installation</span>
                            <strong>Direct APK</strong>
                        </div>
                    </div>

                    <div className="qr-section">
                        <div className="qr-divider">
                            <span>OR SCAN QR CODE</span>
                        </div>

                        <div className="qr-content">
                            <div className="qr-wrapper">
                                <img
                                    src={ANDROID_QR_URL}
                                    alt="GuimarasGo Android APK QR code"
                                />
                            </div>

                            <div className="qr-copy">
                                <h3>Install using your phone</h3>

                                <p>
                                    Scan this QR code with your Android
                                    phone to open the GuimarasGo APK
                                    download.
                                </p>

                                <div className="quick-steps">
                                    <div className="quick-step">
                                        <span>1</span>
                                        <p>
                                            Scan the QR code with your
                                            Android phone.
                                        </p>
                                    </div>

                                    <div className="quick-step">
                                        <span>2</span>
                                        <p>
                                            Tap <strong>Download Android APK</strong>.
                                        </p>
                                    </div>

                                    <div className="quick-step">
                                        <span>3</span>
                                        <p>
                                            Open the downloaded APK and
                                            follow Android's installation
                                            instructions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                <div className="installation-note">
                    <div className="installation-note-icon">
                        ℹ
                    </div>

                    <div>
                        <strong>Android installation</strong>

                        <span>
                            If Android asks for permission to install
                            an app from this source, allow the browser
                            or file manager you used to download the APK,
                            then continue the installation.
                        </span>
                    </div>
                </div>

                <div className="security-note">
                    <span className="security-icon">✓</span>

                    <div>
                        <strong>GuimarasGo Android Package</strong>
                        <p>
                            Use the download button or QR code above to
                            get the GuimarasGo APK from this website.
                        </p>
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
