import React from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const LandingPage = () => {
    const navigate = useNavigate();

    // Keep "Get the App" on the public website.
    // Hide it inside the installed Android app because
    // the user is already using the app.
    const isNativeApp = Capacitor.isNativePlatform();

    return (
        <>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                html,
                body,
                #root {
                    margin: 0;
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family: Arial, Helvetica, sans-serif;
                }

                /* =========================================
                   FULL LANDING PAGE
                ========================================= */

                .landing-page {
                    position: relative;
                    width: 100%;
                    min-height: 100vh;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    overflow: hidden;

                    background-image:
                        linear-gradient(
                            rgba(0, 0, 0, 0.30),
                            rgba(0, 0, 0, 0.30)
                        ),
                        url("https://orbitshub.com/wp-content/uploads/2023/10/what-exactly-are-roro-ships-1024x576.jpg");

                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;

                    padding: 40px;
                }


                /* =========================================
                   TOP NAVIGATION
                ========================================= */

                .landing-nav {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 5;

                    display: flex;
                    align-items: center;
                    justify-content: flex-end;

                    padding: 22px 30px;
                }

                .get-app-nav-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;

                    min-width: 125px;
                    height: 42px;
                    padding: 0 18px;

                    border: 1px solid rgba(255, 255, 255, 0.55);
                    border-radius: 8px;

                    background: rgba(255, 255, 255, 0.92);
                    color: #266eff;

                    font-size: 14px;
                    font-weight: 700;

                    text-decoration: none;
                    cursor: pointer;

                    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);

                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .get-app-nav-button:hover {
                    background: #266eff;
                    color: #ffffff;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.22);
                }

                .get-app-nav-button:active {
                    transform: translateY(0);
                }

                .get-app-nav-icon {
                    font-size: 16px;
                    line-height: 1;
                }

                /* =========================================
                   CENTER GLASS FRAME
                ========================================= */

                .landing-container {
                    position: relative;
                    z-index: 2;

                    width: min(700px, 90vw);
                    min-height: 430px;

                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;

                    text-align: center;

                    padding: 64px 40px 50px;

                    background: rgba(255, 255, 255, 0.62);

                    border: 1px solid rgba(255, 255, 255, 0.55);

                    box-shadow:
                        0 15px 45px rgba(0, 0, 0, 0.20);

                    backdrop-filter: blur(3px);
                    -webkit-backdrop-filter: blur(3px);

                    border-radius: 16px;
                }

                /* =========================================
                   LOGO
                ========================================= */

                .landing-logo {
                    width: 170px;
                    height: 150px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    margin-bottom: -20px;
                }

                .landing-logo img {
                    width: 170px;
                    height: 150px;

                    object-fit: contain;

                    display: block;
                }

                /* =========================================
                   CONTENT
                ========================================= */

                .landing-content {
                    width: 100%;

                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    text-align: center;
                }

                .welcome-text {
                    margin: 0;

                    color: #111;

                    font-size: 22px;
                    font-weight: 400;

                    line-height: 1.2;
                }

                .landing-content h1 {
                    margin: 3px 0 0;

                    color: #111;

                    font-size: clamp(42px, 6vw, 68px);

                    font-weight: 400;

                    line-height: 1.05;

                    letter-spacing: -2px;
                }

                .landing-content p {
                    margin: 10px 0 20px;

                    color: #222;

                    font-size: 16px;
                    font-weight: 400;

                    line-height: 1.4;
                }

                /* =========================================
                   LOGIN BUTTONS
                ========================================= */

                .login-buttons {
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    gap: 12px;

                    width: 100%;

                    margin-top: 5px;

                    flex-wrap: wrap;
                }

                /* =========================================
                   TOURIST BUTTON
                ========================================= */

                .primary-button {
                    width: 180px;
                    height: 44px;

                    border: none;
                    border-radius: 5px;

                    background: #ff7417;

                    color: white;

                    font-size: 14px;
                    font-weight: 600;

                    cursor: pointer;

                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .primary-button:hover {
                    background: #f5660b;

                    transform: translateY(-2px);

                    box-shadow:
                        0 6px 15px rgba(255, 116, 23, 0.30);
                }

                .primary-button:active {
                    transform: translateY(0);
                }

                /* =========================================
                   STAFF BUTTON
                ========================================= */

                .staff-button {
                    width: 180px;
                    height: 44px;

                    border: none;
                    border-radius: 5px;

                    background: #266eff;

                    color: white;

                    font-size: 14px;
                    font-weight: 600;

                    cursor: pointer;

                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .staff-button:hover {
                    background: #1559df;

                    transform: translateY(-2px);

                    box-shadow:
                        0 6px 15px rgba(38, 110, 255, 0.30);
                }

                .staff-button:active {
                    transform: translateY(0);
                }

                /* =========================================
                   ADMIN BUTTON
                ========================================= */

                .admin-button {
                    width: 180px;
                    height: 44px;

                    border: none;
                    border-radius: 5px;

                    background: #333333;

                    color: white;

                    font-size: 14px;
                    font-weight: 600;

                    cursor: pointer;

                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .admin-button:hover {
                    background: #222222;

                    transform: translateY(-2px);

                    box-shadow:
                        0 6px 15px rgba(0, 0, 0, 0.25);
                }

                .admin-button:active {
                    transform: translateY(0);
                }

                /* =========================================
                   DOWNLOAD ANDROID APP BUTTON
                ========================================= */

                .download-app-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;

                    width: 180px;
                    height: 44px;

                    margin-top: 2px;

                    border: 1px solid rgba(38, 110, 255, 0.25);
                    border-radius: 5px;

                    background: rgba(255, 255, 255, 0.90);

                    color: #266eff;

                    font-size: 14px;
                    font-weight: 600;

                    text-decoration: none;

                    cursor: pointer;

                    transition:
                        transform 0.2s ease,
                        background 0.2s ease,
                        color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .download-app-button:hover {
                    background: #266eff;

                    color: #ffffff;

                    transform: translateY(-2px);

                    box-shadow:
                        0 6px 15px rgba(38, 110, 255, 0.25);
                }

                .download-app-button:active {
                    transform: translateY(0);
                }

                .download-app-icon {
                    margin-right: 7px;

                    font-size: 16px;

                    line-height: 1;
                }


                @media (max-width: 768px) {

                    .landing-nav {
                        padding: 16px 18px;
                    }

                    .get-app-nav-button {
                        min-width: 116px;
                        height: 40px;
                        padding: 0 15px;
                        font-size: 13px;
                    }
                }

                /* =========================================
                   TABLET
                ========================================= */

                @media (max-width: 768px) {

                    .landing-page {
                        padding: 25px;
                    }

                    .landing-container {
                        width: 90vw;
                        min-height: 400px;

                        padding: 40px 30px;
                    }

                    .landing-logo {
                        width: 145px;
                        height: 125px;

                        margin-bottom: -15px;
                    }

                    .landing-logo img {
                        width: 145px;
                        height: 125px;
                    }

                    .welcome-text {
                        font-size: 19px;
                    }

                    .landing-content h1 {
                        font-size: clamp(38px, 8vw, 55px);
                    }

                    .landing-content p {
                        font-size: 14px;

                        margin-top: 8px;
                        margin-bottom: 18px;
                    }

                    .login-buttons {
                        gap: 10px;
                    }

                    .primary-button,
                    .staff-button,
                    .admin-button,
                    .download-app-button {
                        width: 165px;
                        height: 42px;
                    }
                }

                /* =========================================
                   MOBILE
                ========================================= */

                @media (max-width: 480px) {

                    .landing-page {
                        padding: 18px;
                    }

                    .landing-container {
                        width: 100%;
                        min-height: 390px;

                        padding: 35px 20px;
                    }

                    .landing-logo {
                        width: 125px;
                        height: 110px;

                        margin-bottom: -10px;
                    }

                    .landing-logo img {
                        width: 125px;
                        height: 110px;
                    }

                    .welcome-text {
                        font-size: 17px;
                    }

                    .landing-content h1 {
                        font-size: 39px;

                        letter-spacing: -1.5px;
                    }

                    .landing-content p {
                        font-size: 13px;

                        margin-top: 8px;
                        margin-bottom: 18px;
                    }

                    .login-buttons {
                        flex-direction: column;

                        gap: 10px;

                        width: 100%;
                    }

                    .primary-button,
                    .staff-button,
                    .admin-button,
                    .download-app-button {
                        width: 180px;
                        height: 40px;

                        font-size: 13px;
                    }
                }

                /* =========================================
                   VERY SMALL PHONES
                ========================================= */

                @media (max-width: 400px) {

                    .landing-page {
                        padding: 12px;
                    }

                    .landing-container {
                        min-height: 360px;

                        padding: 28px 15px;
                    }

                    .landing-logo {
                        width: 110px;
                        height: 95px;
                    }

                    .landing-logo img {
                        width: 110px;
                        height: 95px;
                    }

                    .welcome-text {
                        font-size: 15px;
                    }

                    .landing-content h1 {
                        font-size: 34px;
                    }

                    .landing-content p {
                        font-size: 12px;
                    }

                    .primary-button,
                    .staff-button,
                    .admin-button,
                    .download-app-button {
                        width: 170px;
                        height: 38px;
                    }
                }
            `}</style>

            <main className="landing-page">

                {/* GET THE APP NAVIGATION
                    Visible on the website only.
                    Hidden inside the installed Android app. */}
                {!isNativeApp && (
                    <nav
                        className="landing-nav"
                        aria-label="Application navigation"
                    >
                        <a
                            href="/get-app"
                            className="get-app-nav-button"
                        >
                            <span className="get-app-nav-icon">📱</span>
                            Get the App
                        </a>
                    </nav>
                )}

                <div className="landing-container">

                    {/* LOGO */}

                    <div className="landing-logo">

                        <img
                            src="/images/guimarasgo-logo.png"
                            alt="GuimarasGo Logo"
                        />

                    </div>

                    {/* CONTENT */}

                    <div className="landing-content">

                        <div className="welcome-text">
                            Welcome to
                        </div>

                        <h1>
                            GuimarasGo
                        </h1>

                        <p>
                            Travel Smarter Across Guimaras.
                        </p>

                        {/* LOGIN */}

                        <div className="login-buttons">

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </button>



                        </div>

                    </div>

                </div>

            </main>
        </>
    );
};

export default LandingPage;