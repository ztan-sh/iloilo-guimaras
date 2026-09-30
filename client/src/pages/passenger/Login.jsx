import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const [popup, setPopup] = useState({
        show: false,
        type: "",
        title: "",
        message: "",
        redirecting: false,
    });
    const logoUrl =
    "/images/guimarasgo-logo.png";
    
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email || !password) {
            setPopup({
                show: true,
                type: "error",
                title: "Incomplete Information",
                message: "Please enter your email and password.",
                redirecting: false,
            });

            return;
        }

        try {
            setLoading(true);

            // =====================================================
            // ONE LOGIN FORM
            // =====================================================
            // Check the existing authentication systems one by one.
            // No existing backend authentication route is removed.
            // =====================================================

            const loginRequest = async (endpoint) => {
                const response = await fetch(
                    `${API_BASE_URL}${endpoint}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                            email,
                            password,
                        }),
                    }
                );

                let data = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                return {
                    response,
                    data,
                };
            };

            // =====================================================
            // CLEAR PREVIOUS ROLE SESSIONS
            // =====================================================

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("staffToken");
            localStorage.removeItem("staff");
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminData");

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("staffToken");
            sessionStorage.removeItem("staff");
            sessionStorage.removeItem("adminToken");
            sessionStorage.removeItem("adminData");

            // Keep the existing passenger booking-cache cleanup.
            sessionStorage.removeItem("allBookings");
            sessionStorage.removeItem("recentBookings");
            sessionStorage.removeItem("confirmedBooking");
            sessionStorage.removeItem("latestBooking");
            sessionStorage.removeItem("paymentDetails");
            sessionStorage.removeItem("paymentStatus");

            // =====================================================
            // 1. PASSENGER / USER LOGIN
            // =====================================================

            const userResult = await loginRequest("/auth/login");

            if (userResult.response.ok) {
                const data = userResult.data;

                if (rememberMe) {
                    localStorage.setItem(
                        "token",
                        data.token
                    );

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                } else {
                    sessionStorage.setItem(
                        "token",
                        data.token
                    );

                    sessionStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

                setPopup({
                    show: true,
                    type: "success",
                    title: "Login Successful",
                    message: "You have successfully signed in.",
                    redirecting: true,
                });

                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);

                return;
            }

            // =====================================================
            // 2. ADMIN LOGIN
            // =====================================================

            const adminResult = await loginRequest("/admin/login");

            if (adminResult.response.ok) {
                const data = adminResult.data;

                localStorage.setItem(
                    "adminToken",
                    data.token
                );

                localStorage.setItem(
                    "adminData",
                    JSON.stringify(data.admin || data.user || {})
                );

                setPopup({
                    show: true,
                    type: "success",
                    title: "Login Successful",
                    message:
                        "Administrator account verified. Redirecting to the Admin Dashboard.",
                    redirecting: true,
                });

                setTimeout(() => {
                    navigate("/admin-dashboard");
                }, 2000);

                return;
            }

            // =====================================================
            // 3. STAFF LOGIN
            // =====================================================
            // IMPORTANT:
            // The existing Staff backend is mounted at:
            // /api/staff-auth
            // and its login route is:
            // /login
            // Therefore the complete endpoint is:
            // /api/staff-auth/login
            // =====================================================

            const staffResult = await loginRequest("/staff-auth/login");

            if (staffResult.response.ok) {
                const data = staffResult.data;

                localStorage.setItem(
                    "staffToken",
                    data.token
                );

                localStorage.setItem(
                    "staff",
                    JSON.stringify(data.staff || data.user || {})
                );

                setPopup({
                    show: true,
                    type: "success",
                    title: "Login Successful",
                    message:
                        "Staff account verified. Redirecting to the Staff Scanner.",
                    redirecting: true,
                });

                setTimeout(() => {
                    navigate("/staff/scanner");
                }, 2000);

                return;
            }

            // =====================================================
            // ALL LOGIN ATTEMPTS FAILED
            // =====================================================

            setPopup({
                show: true,
                type: "error",
                title: "Login Failed",
                message:
                    "Invalid email or password.",
                redirecting: false,
            });

        } catch (error) {
            console.error("Login Error:", error);

            setPopup({
                show: true,
                type: "error",
                title: "Connection Error",
                message:
                    "Unable to connect to the server. Please make sure the backend is running.",
                redirecting: false,
            });
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CLOSE ERROR POPUP
    // =========================================================

    const closePopup = () => {
        setPopup({
            show: false,
            type: "",
            title: "",
            message: "",
            redirecting: false,
        });
    };


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
                    padding: 0;
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                    background: #214f4d;
                    color: #ffffff;
                }

                button,
                input {
                    font-family: inherit;
                }

                .login-page {
                    width: 100%;
                    min-height: 100vh;
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 35px 28px;
                    background: #214f4d;
                }

                .login-shell {
                    position: relative;
                    width: 100%;
                    max-width: 1160px;
                    min-height: 610px;
                    display: grid;
                    grid-template-columns: minmax(430px, 1fr) minmax(400px, 0.92fr);
                    overflow: hidden;
                    background: #1d1d1b;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                }

                .login-visual {
                    position: relative;
                    min-height: 610px;
                    margin: 38px 0 38px 38px;
                    border-radius: 14px;
                    overflow: hidden;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.05) 0%,
                            rgba(0, 0, 0, 0.16) 45%,
                            rgba(0, 0, 0, 0.72) 100%
                        ),
                        url("/images/login/login-background.jpg")
                        center center / cover no-repeat;
                }

                .login-visual::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.04) 0%,
                            transparent 48%,
                            rgba(0, 0, 0, 0.18) 100%
                        );
                    pointer-events: none;
                }

                .visual-back {
                    position: absolute;
                    top: 18px;
                    left: 18px;
                    z-index: 3;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    min-height: 34px;
                    padding: 0 12px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.10);
                    color: #ffffff;
                    font-size: 12px;
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    transition:
                        background 0.2s ease,
                        transform 0.2s ease;
                }

                .visual-back:hover {
                    background: rgba(255, 255, 255, 0.18);
                    transform: translateX(-2px);
                }

                .visual-logo {
                    position: absolute;
                    top: 17px;
                    right: 18px;
                    z-index: 3;
                    width: 48px;
                    height: 48px;
                    object-fit: contain;
                    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25));
                }

                .visual-copy {
                    position: absolute;
                    left: 27px;
                    right: 27px;
                    bottom: 25px;
                    z-index: 3;
                    max-width: 340px;
                }

                .visual-copy h2 {
                    margin: 0;
                    color: #ffffff;
                    font-size: clamp(28px, 3vw, 38px);
                    line-height: 0.98;
                    font-weight: 700;
                    letter-spacing: -1px;
                }

                .visual-copy h2 span {
                    display: block;
                    color: #ff8a24;
                    font-family: Georgia, "Times New Roman", serif;
                    font-style: italic;
                    font-weight: 700;
                    margin-top: 4px;
                }

                .visual-copy p {
                    margin: 14px 0 0;
                    max-width: 300px;
                    color: rgba(255, 255, 255, 0.90);
                    font-size: 12px;
                    line-height: 1.45;
                }

                .login-panel {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 54px 62px;
                    background: #1d1d1b;
                }

                .login-content {
                    width: 100%;
                    max-width: 390px;
                }

                .login-heading {
                    margin-bottom: 24px;
                }

                .login-heading h1 {
                    margin: 0;
                    color: #ffffff;
                    font-size: clamp(30px, 3vw, 38px);
                    line-height: 1.08;
                    font-weight: 400;
                    letter-spacing: -1px;
                }

                .login-heading p {
                    margin: 7px 0 0;
                    color: rgba(255, 255, 255, 0.65);
                    font-size: 11px;
                    line-height: 1.45;
                }

                .login-heading a {
                    color: #ffffff;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }

                .login-form {
                    width: 100%;
                }

                .form-group {
                    position: relative;
                    margin-bottom: 16px;
                }

                .form-group label {
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    z-index: 1;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.86);
                    font-size: 10px;
                    font-weight: 400;
                    pointer-events: none;
                    transition:
                        opacity 0.2s ease,
                        transform 0.2s ease;
                }

                .form-group input {
                    width: 100%;
                    height: 48px;
                    padding: 0 20px;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    outline: none;
                    background: #595959;
                    color: #ffffff;
                    font-size: 12px;
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .form-group input::placeholder {
                    color: transparent;
                }

                .form-group input:focus {
                    background: #646464;
                    border-color: rgba(255, 138, 36, 0.75);
                    box-shadow: 0 0 0 3px rgba(255, 138, 36, 0.12);
                }

                .form-group input:focus + .field-label,
                .form-group input:not(:placeholder-shown) + .field-label {
                    opacity: 0;
                }

                .password-input-wrapper {
                    position: relative;
                }

                .password-input-wrapper input {
                    padding-right: 48px;
                }

                .password-toggle {
                    position: absolute;
                    top: 50%;
                    right: 8px;
                    width: 34px;
                    height: 34px;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 5px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.70);
                    cursor: pointer;
                    transition:
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .password-toggle:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.08);
                }

                .password-toggle svg {
                    width: 16px;
                    height: 16px;
                }

                .login-options {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin: -1px 0 18px;
                }

                .remember-option {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    color: rgba(255, 255, 255, 0.62);
                    font-size: 10px;
                    cursor: pointer;
                }

                .remember-option input {
                    width: 13px;
                    height: 13px;
                    margin: 0;
                    accent-color: #ff8a24;
                    cursor: pointer;
                }

                .forgot-password {
                    padding: 0;
                    border: none;
                    background: transparent;
                    color: #ff8a24;
                    font-size: 10px;
                    cursor: pointer;
                }

                .forgot-password:hover {
                    text-decoration: underline;
                }

                .primary-button {
                    width: 100%;
                    height: 48px;
                    border: none;
                    border-radius: 24px;
                    background: #ff8a24;
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(255, 138, 36, 0.16);
                    transition:
                        background 0.2s ease,
                        transform 0.15s ease,
                        box-shadow 0.2s ease;
                }

                .primary-button:hover {
                    background: #ff7814;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 24px rgba(255, 138, 36, 0.22);
                }

                .primary-button:active {
                    transform: translateY(0);
                }

                .primary-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                    transform: none;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 22px 0 12px;
                    color: rgba(255, 255, 255, 0.42);
                    font-size: 9px;
                }

                .divider::before,
                .divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.12);
                }

                .divider span {
                    white-space: nowrap;
                }

                .social-login {
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                }

                .social-button {
                    width: 100%;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    border: 1px solid rgba(255, 255, 255, 0.65);
                    border-radius: 22px;
                    background: transparent;
                    color: #ffffff;
                    font-size: 10px;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        transform 0.15s ease;
                }

                .social-button:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: #ffffff;
                    transform: translateY(-1px);
                }

                .social-icon {
                    width: 17px;
                    height: 17px;
                    flex-shrink: 0;
                }

                .apple-icon {
                    color: #ffffff;
                    font-size: 16px;
                }

                .account-section {
                    margin-top: 22px;
                    text-align: center;
                }

                .account-text {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.58);
                    font-size: 10px;
                }

                .auth-link {
                    color: #ff8a24;
                    font-size: 10px;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }

                .auth-footer {
                    display: flex;
                    justify-content: center;
                    gap: 22px;
                    margin-top: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.10);
                    color: rgba(255, 255, 255, 0.38);
                    font-size: 8px;
                }

                .auth-footer span {
                    cursor: pointer;
                    transition: color 0.2s ease;
                }

                .auth-footer span:hover {
                    color: #ff8a24;
                }

                .popup-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.60);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    animation: popupFadeIn 0.2s ease;
                }

                .popup-modal {
                    width: 100%;
                    max-width: 380px;
                    padding: 34px 30px 30px;
                    background: #ffffff;
                    border: 1px solid #eeeeee;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
                    animation: popupScale 0.25s ease;
                }

                .popup-icon {
                    width: 62px;
                    height: 62px;
                    margin: 0 auto 17px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 27px;
                    font-weight: 700;
                }

                .popup-icon.success {
                    background: #fff3eb;
                    border: 2px solid #ff7818;
                    color: #ff7818;
                }

                .popup-icon.error {
                    background: #fff1f1;
                    border: 2px solid #e54848;
                    color: #e54848;
                }

                .popup-modal h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #111111;
                }

                .popup-modal p {
                    margin: 9px 0 0;
                    font-size: 11px;
                    line-height: 1.6;
                    color: #777777;
                }

                .popup-close {
                    width: 110px;
                    height: 39px;
                    margin-top: 21px;
                    border: none;
                    border-radius: 6px;
                    background: #ff7818;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .loading-text {
                    margin-top: 17px;
                    font-size: 11px;
                    color: #999999;
                }

                .loading-dots {
                    display: inline-flex;
                    margin-left: 3px;
                    gap: 3px;
                }

                .loading-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #ff7818;
                    animation: dotBounce 0.8s infinite ease-in-out;
                }

                .loading-dot:nth-child(1) {
                    animation-delay: 0s;
                }

                .loading-dot:nth-child(2) {
                    animation-delay: 0.15s;
                }

                .loading-dot:nth-child(3) {
                    animation-delay: 0.30s;
                }

                @keyframes popupFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes popupScale {
                    from {
                        opacity: 0;
                        transform: scale(0.94) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes dotBounce {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.45;
                    }
                    30% {
                        transform: translateY(-5px);
                        opacity: 1;
                    }
                }

                @media (max-width: 900px) {
                    .login-page {
                        padding: 22px;
                    }

                    .login-shell {
                        grid-template-columns: minmax(340px, 0.95fr) minmax(350px, 1fr);
                    }

                    .login-visual {
                        margin: 25px 0 25px 25px;
                        min-height: 560px;
                    }

                    .login-panel {
                        padding: 40px;
                    }
                }

                @media (max-width: 720px) {
                    .login-page {
                        padding: 0;
                        align-items: stretch;
                    }

                    .login-shell {
                        min-height: 100vh;
                        min-height: 100dvh;
                        grid-template-columns: 1fr;
                        overflow-y: auto;
                        background: #1d1d1b;
                    }

                    .login-visual {
                        min-height: 350px;
                        height: 48vh;
                        max-height: 480px;
                        margin: 0;
                        border-radius: 0 0 16px 16px;
                    }

                    .login-panel {
                        min-height: auto;
                        padding: 42px 24px 50px;
                    }

                    .login-content {
                        max-width: 430px;
                    }

                    .visual-copy {
                        left: 24px;
                        bottom: 24px;
                    }

                    .visual-copy h2 {
                        font-size: 31px;
                    }
                }

                @media (max-width: 480px) {
                    .login-visual {
                        min-height: 300px;
                        height: 42vh;
                    }

                    .visual-back {
                        top: 14px;
                        left: 14px;
                        min-height: 32px;
                        font-size: 11px;
                    }

                    .visual-logo {
                        top: 13px;
                        right: 14px;
                        width: 42px;
                        height: 42px;
                    }

                    .visual-copy {
                        left: 20px;
                        right: 20px;
                        bottom: 20px;
                    }

                    .visual-copy h2 {
                        font-size: 28px;
                    }

                    .visual-copy p {
                        margin-top: 10px;
                        font-size: 11px;
                    }

                    .login-panel {
                        padding: 34px 20px 42px;
                    }

                    .login-heading h1 {
                        font-size: 30px;
                    }

                    .login-heading p {
                        font-size: 10px;
                    }

                    .form-group input {
                        height: 48px;
                    }

                    .primary-button {
                        height: 48px;
                    }

                    .auth-footer {
                        gap: 15px;
                    }
                }
                    /* Hide browser/native password reveal controls */
                    .password-input-wrapper input::-ms-reveal,
                    .password-input-wrapper input::-ms-clear {
                        display: none;
                    }

                    .password-input-wrapper input::-webkit-credentials-auto-fill-button {
                        visibility: hidden;
                        pointer-events: none;
                        position: absolute;
                        right: 0;
                    }
            `}</style>

            {popup.show && (
                <div className="popup-overlay">
                    <div className="popup-modal">
                        <div className={`popup-icon ${popup.type}`}>
                            {popup.type === "success" ? "✓" : "!"}
                        </div>

                        <h2>{popup.title}</h2>

                        <p>{popup.message}</p>

                        {popup.redirecting && (
                            <div className="loading-text">
                                Loading
                                <span className="loading-dots">
                                    <span className="loading-dot"></span>
                                    <span className="loading-dot"></span>
                                    <span className="loading-dot"></span>
                                </span>
                            </div>
                        )}

                        {!popup.redirecting && (
                            <button
                                type="button"
                                className="popup-close"
                                onClick={closePopup}
                            >
                                Okay
                            </button>
                        )}
                    </div>
                </div>
            )}

            <main className="login-page">
                <section className="login-shell">
                    <div className="login-visual">
                        <button
                            type="button"
                            className="visual-back"
                            onClick={() => navigate("/")}
                            aria-label="Go back to landing page"
                        >
                            ← Back
                        </button>

                        <img
                            src={logoUrl}
                            alt="GuimarasGo"
                            className="visual-logo"
                        />

                        <div className="visual-copy">
                            <h2>
                                Skip the line.
                                <span>Book your crossing.</span>
                            </h2>

                            <p>
                                Create an account or sign in to check schedules,
                                book slots, and get your crossing details in seconds.
                            </p>
                        </div>
                    </div>

                    <section className="login-panel">
                        <div className="login-content">
                            <div className="login-heading">
                                <h1>Welcome back</h1>
                                <p>
                                    Don't have an account?{" "}
                                    <Link to="/register">Create one</Link>
                                </p>
                            </div>

                            <form
                                className="login-form"
                                onSubmit={handleSubmit}
                            >
                                <div className="form-group">
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder=" "
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                    />
                                    <label
                                        htmlFor="email"
                                        className="field-label"
                                    >
                                        Email
                                    </label>
                                </div>

                                <div className="form-group">
                                    <div className="password-input-wrapper">
                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder=" "
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            autoComplete="current-password"
                                            required
                                        />

                                        <label
                                            htmlFor="password"
                                            className="field-label"
                                        >
                                            Password
                                        </label>

                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            title={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <FiEyeOff />
                                            ) : (
                                                <FiEye />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="login-options">
                                    <label className="remember-option">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(event) =>
                                                setRememberMe(
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        <span>Remember me</span>
                                    </label>

                                    <button
                                        type="button"
                                        className="forgot-password"
                                        onClick={() =>
                                            setPopup({
                                                show: true,
                                                type: "error",
                                                title: "Coming Soon",
                                                message:
                                                    "Forgot password functionality will be added later.",
                                                redirecting: false,
                                            })
                                        }
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={loading}
                                >
                                    {loading ? "Signing In..." : "Login"}
                                </button>
                            </form>

                            <div className="divider">
                                <span>Or continue with</span>
                            </div>

                            <div className="social-login">
                                <button
                                    type="button"
                                    className="social-button google-button"
                                    onClick={() =>
                                        setPopup({
                                            show: true,
                                            type: "error",
                                            title: "Coming Soon",
                                            message:
                                                "Google login functionality will be added later.",
                                            redirecting: false,
                                        })
                                    }
                                >
                                    <FcGoogle className="social-icon" />
                                    <span>Continue with Google</span>
                                </button>

                                <button
                                    type="button"
                                    className="social-button apple-button"
                                    onClick={() =>
                                        setPopup({
                                            show: true,
                                            type: "error",
                                            title: "Coming Soon",
                                            message:
                                                "Apple login functionality will be added later.",
                                            redirecting: false,
                                        })
                                    }
                                >
                                    <FaApple className="social-icon apple-icon" />
                                    <span>Continue with Apple</span>
                                </button>
                            </div>

                            <div className="account-section">
                                <p className="account-text">
                                    Don't have an account?{" "}
                                    <Link
                                        to="/register"
                                        className="auth-link"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            </div>

                            <div className="auth-footer">
                                <span>Privacy Policy</span>
                                <span>Terms of Service</span>
                                <span>Help Center</span>
                            </div>
                        </div>
                    </section>
                </section>
            </main>
        </>
    );
};

export default Login;
