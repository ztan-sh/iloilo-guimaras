import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StaffLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email address and password.");
            return;
        }

        try {
            setLoading(true);

            // FIXED: Staff login endpoint
            const response = await api.post("/staff-auth/login", {
                email: email.trim(),
                password,
            });

            const data = response.data;

            /*
             * Store staff authentication information
             */
            if (data.token) {
                if (rememberMe) {
                    localStorage.setItem("staffToken", data.token);
                } else {
                    sessionStorage.setItem("staffToken", data.token);
                }
            }

            if (data.staff) {
                localStorage.setItem(
                    "staff",
                    JSON.stringify(data.staff)
                );
            }

            /*
             * Go to Staff Scanner after successful login
             */
            navigate("/staff/scanner");

        } catch (err) {
            console.error("Staff login error:", err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                setError("Invalid email or password.");
            } else {
                setError(
                    "Unable to sign in. Please check your connection and try again."
                );
            }
        } finally {
            setLoading(false);
        }
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
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family: Arial, Helvetica, sans-serif;
                    background: #1f4d4a;
                    color: #ffffff;
                }

                /* =========================================
                   STAFF LOGIN
                   SPLIT SCREEN DESIGN
                ========================================= */

                .staff-login-page {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 36px 40px;
                    background: #1f4d4a;
                }

                .staff-login-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 1120px;
                    min-height: 620px;
                    display: grid;
                    grid-template-columns: minmax(360px, 48%) minmax(380px, 52%);
                    overflow: hidden;
                    background: #20201f;
                    border-radius: 2px;
                    box-shadow: 0 22px 55px rgba(0, 0, 0, 0.20);
                }

                /* =========================================
                   LEFT VISUAL PANEL
                ========================================= */

                .staff-visual-panel {
                    position: relative;
                    min-height: 620px;
                    margin: 25px;
                    border-radius: 12px;
                    overflow: hidden;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.05) 0%,
                            rgba(0, 0, 0, 0.72) 100%
                        ),
                         url("/images/login-staff/login-staff.png") center / cover no-repeat,
                        #173b3a;
                }

                .staff-visual-panel::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        180deg,
                        rgba(0, 0, 0, 0.02),
                        rgba(0, 0, 0, 0.68)
                    );
                    pointer-events: none;
                }

                .staff-visual-back {
                    position: absolute;
                    top: 14px;
                    left: 14px;
                    z-index: 3;
                    border: none;
                    border-radius: 20px;
                    padding: 7px 12px;
                    background: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                    font-size: 11px;
                    cursor: pointer;
                    backdrop-filter: blur(5px);
                }

                .staff-visual-back:hover {
                    background: rgba(255, 255, 255, 0.20);
                }

                .staff-visual-logo {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    z-index: 3;
                    width: 38px;
                    height: 38px;
                    object-fit: contain;
                }

                .staff-visual-copy {
                    position: absolute;
                    left: 20px;
                    right: 20px;
                    bottom: 24px;
                    z-index: 3;
                }

                .staff-visual-copy h2 {
                    margin: 0 0 8px;
                    max-width: 300px;
                    color: #ffffff;
                    font-size: 25px;
                    line-height: 1.05;
                    font-weight: 700;
                }

                .staff-visual-copy h2 span {
                    color: #ff861c;
                    font-style: italic;
                }

                .staff-visual-copy p {
                    margin: 0;
                    max-width: 275px;
                    color: rgba(255, 255, 255, 0.86);
                    font-size: 10px;
                    line-height: 1.45;
                }

                /* =========================================
                   RIGHT FORM PANEL
                ========================================= */

                .staff-form-panel {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 0;
                    padding: 48px 68px;
                    background: #20201f;
                }

                .staff-form-content {
                    width: 100%;
                    max-width: 390px;
                }

                .staff-login-header {
                    margin-bottom: 25px;
                }

                .staff-login-header h1 {
                    margin: 0 0 5px;
                    color: #ffffff;
                    font-size: 28px;
                    line-height: 1.15;
                    font-weight: 500;
                }

                .staff-login-header p {
                    margin: 0;
                    color: #b8b8b8;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .staff-form-card {
                    width: 100%;
                }

                .staff-form {
                    width: 100%;
                }

                .staff-field {
                    margin-bottom: 15px;
                }

                .staff-field label {
                    display: block;
                    margin-bottom: 6px;
                    color: #d7d7d7;
                    font-size: 10px;
                    font-weight: 500;
                }

                .staff-input-wrapper {
                    position: relative;
                }

                .staff-input {
                    width: 100%;
                    height: 40px;
                    padding: 0 12px;
                    border: 1px solid #5b5b5b;
                    border-radius: 5px;
                    outline: none;
                    background: #4b4b4b;
                    color: #ffffff;
                    font-size: 11px;
                }

                .staff-input::placeholder {
                    color: #d0d0d0;
                }

                .staff-input:focus {
                    border-color: #ff861c;
                    box-shadow: 0 0 0 2px rgba(255, 134, 28, 0.15);
                }

                .password-input {
                    padding-right: 52px;
                }

                .show-password-button {
                    position: absolute;
                    top: 50%;
                    right: 9px;
                    transform: translateY(-50%);
                    border: none;
                    background: transparent;
                    color: #ffffff;
                    font-size: 9px;
                    cursor: pointer;
                    padding: 4px;
                }

                .staff-options {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin: 2px 0 18px;
                }

                .remember-container {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #bdbdbd;
                    font-size: 9px;
                    cursor: pointer;
                }

                .remember-container input {
                    width: 12px;
                    height: 12px;
                    margin: 0;
                    accent-color: #ff861c;
                }

                .staff-role-text {
                    color: #a9a9a9;
                    font-size: 9px;
                }

                .staff-error {
                    margin-bottom: 14px;
                    padding: 9px 10px;
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    border-radius: 5px;
                    background: rgba(127, 29, 29, 0.35);
                    color: #fecaca;
                    font-size: 10px;
                    line-height: 1.4;
                }

                .staff-signin-button {
                    width: 100%;
                    height: 40px;
                    border: none;
                    border-radius: 20px;
                    background: #ff8a24;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(255, 134, 28, 0.14);
                    transition: transform 0.2s ease, background 0.2s ease;
                }

                .staff-signin-button:hover:not(:disabled) {
                    background: #ff9b42;
                    transform: translateY(-1px);
                }

                .staff-signin-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .staff-divider {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0 17px;
                    color: #777777;
                    font-size: 9px;
                }

                .staff-divider::before,
                .staff-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #4b4b4b;
                }

                .staff-divider span {
                    white-space: nowrap;
                }

                .staff-info {
                    margin-bottom: 12px;
                    padding: 12px;
                    border: 1px solid #464646;
                    border-radius: 5px;
                    background: #292929;
                    color: #a8a8a8;
                    font-size: 9px;
                    line-height: 1.45;
                    text-align: center;
                }

                .back-home-button {
                    width: 100%;
                    height: 40px;
                    border: 1px solid #686868;
                    border-radius: 5px;
                    background: transparent;
                    color: #ffffff;
                    font-size: 10px;
                    cursor: pointer;
                }

                .back-home-button:hover {
                    background: #2c2c2c;
                }

                /* =========================================
                   TABLET
                ========================================= */

                @media (max-width: 900px) {
                    .staff-login-page {
                        padding: 25px;
                    }

                    .staff-login-wrapper {
                        max-width: 850px;
                        grid-template-columns: 42% 58%;
                    }

                    .staff-visual-panel {
                        margin: 20px;
                        min-height: 570px;
                    }

                    .staff-form-panel {
                        padding: 40px 42px;
                    }
                }

                /* =========================================
                   MOBILE
                ========================================= */

                @media (max-width: 700px) {
                    .staff-login-page {
                        min-height: 100vh;
                        padding: 0;
                        align-items: stretch;
                    }

                    .staff-login-wrapper {
                        max-width: none;
                        min-height: 100vh;
                        grid-template-columns: 1fr;
                        border-radius: 0;
                    }

                    .staff-visual-panel {
                        display: none;
                    }

                    .staff-form-panel {
                        min-height: 100vh;
                        padding: 34px 24px;
                        align-items: center;
                    }

                    .staff-form-content {
                        max-width: 430px;
                    }

                    .staff-login-header h1 {
                        font-size: 27px;
                    }
                }

                /* =========================================
                   SMALL PHONES
                ========================================= */

                @media (max-width: 430px) {
                    .staff-form-panel {
                        padding: 28px 20px;
                    }

                    .staff-login-header {
                        margin-bottom: 22px;
                    }

                    .staff-login-header h1 {
                        font-size: 25px;
                    }

                    .staff-input,
                    .staff-signin-button,
                    .back-home-button {
                        height: 44px;
                    }

                    .staff-options {
                        align-items: flex-start;
                    }
                }

                @media (max-width: 360px) {
                    .staff-form-panel {
                        padding: 24px 16px;
                    }

                    .staff-login-header h1 {
                        font-size: 23px;
                    }

                    .staff-login-header p,
                    .staff-field label {
                        font-size: 10px;
                    }
                }
            `}</style>

            <main className="staff-login-page">

                <div className="staff-login-wrapper">

                    {/* =========================================
                        LEFT VISUAL PANEL
                    ========================================= */}

                    <section className="staff-visual-panel">

                        <button
                            type="button"
                            className="staff-visual-back"
                            onClick={() => navigate("/")}
                            aria-label="Back to home"
                        >
                            ← Back
                        </button>

                        <img
                            className="staff-visual-logo"
                            src="/images/guimarasgo-logo.png"
                            alt="GuimarasGo Logo"

                            
                        />

                        <div className="staff-visual-copy">
                            <h2>
                                Skip the line.<br />
                                <span>Book</span> your crossing.
                            </h2>

                            <p>
                                Create an account to check schedules,
                                book slots, and get your QR ticket in seconds.
                            </p>
                        </div>

                    </section>


                    {/* =========================================
                        RIGHT SIGN-IN PANEL
                    ========================================= */}

                    <section className="staff-form-panel">

                        <div className="staff-form-content">

                            {/* HEADER */}
                            <div className="staff-login-header">

                        <h1>
                            Welcome Back
                        </h1>

                        <p>
                            Sign in to your staff account to continue
                        </p>

                    </div>


                    {/* FORM */}
                    <div className="staff-form-card">

                        <form
                            className="staff-form"
                            onSubmit={handleSubmit}
                        >

                            {/* EMAIL */}
                            <div className="staff-field">

                                <label htmlFor="staff-email">
                                    Email Address
                                </label>

                                <input
                                    id="staff-email"
                                    type="email"
                                    className="staff-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            {/* PASSWORD */}
                            <div className="staff-field">

                                <label htmlFor="staff-password">
                                    Password
                                </label>

                                <div className="staff-input-wrapper">

                                    <input
                                        id="staff-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        className="staff-input password-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="show-password-button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                    >
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>

                            </div>


                            {/* OPTIONS */}
                            <div className="staff-options">

                                <label className="remember-container">

                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) =>
                                            setRememberMe(
                                                e.target.checked
                                            )
                                        }
                                    />

                                    <span>
                                        Remember me
                                    </span>

                                </label>

                                <span className="staff-role-text">
                                    Authorized Staff
                                </span>

                            </div>


                            {/* ERROR */}
                            {error && (
                                <div className="staff-error">
                                    {error}
                                </div>
                            )}


                            {/* SIGN IN */}
                            <button
                                type="submit"
                                className="staff-signin-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing In..."
                                    : "Sign In"}
                            </button>


                            {/* DIVIDER */}
                            <div className="staff-divider">
                                <span>
                                    Staff Access
                                </span>
                            </div>


                            {/* INFORMATION */}
                            <div className="staff-info">

                                Staff accounts are provided by the
                                system administrator. If you do not
                                have staff credentials, please contact
                                your administrator.

                            </div>


                            {/* BACK HOME */}
                            <button
                                type="button"
                                className="back-home-button"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Back to Home
                            </button>

                        </form>

                            </div>

                        </div>

                    </section>

                </div>

            </main>
        </>
    );
};

export default StaffLogin;