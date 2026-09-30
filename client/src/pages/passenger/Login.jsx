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

                /* =====================================================
                   RESET
                ===================================================== */

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

                    background: #ffffff;
                    color: #111111;
                }

                button,
                input {
                    font-family: inherit;
                }


                /* =====================================================
                   PAGE
                ===================================================== */

                .auth-page {
                    width: 100%;
                    min-height: 100vh;
                    min-height: 100dvh;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    padding: 24px;

                    background:
                        linear-gradient(
                            180deg,
                            #ffffff 0%,
                            #ffffff 100%
                        );
                }


                /* =====================================================
                   MAIN FRAME
                ===================================================== */

                .auth-container {
                    position: relative;

                    width: 100%;
                    max-width: 1120px;

                    min-height: 720px;

                    background: #ffffff;

                    border: 1px solid #dddddd;

                    border-radius: 7px;

                    overflow: hidden;

                    display: flex;
                    flex-direction: column;

                    box-shadow:
                        0 8px 28px
                        rgba(0, 0, 0, 0.04);
                }


                /* =====================================================
                   BACK BUTTON
                ===================================================== */

                .back-button {
                    position: absolute;

                    top: 18px;
                    left: 18px;

                    width: 40px;
                    height: 40px;

                    border: none;

                    background: transparent;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    font-size: 23px;
                    font-weight: 400;

                    color: #333333;

                    cursor: pointer;

                    z-index: 10;

                    transition:
                        color 0.2s ease,
                        transform 0.2s ease;
                }

                .back-button:hover {
                    color: #ff7818;

                    transform:
                        translateX(-2px);
                }


                /* =====================================================
                   LOGO HEADER
                ===================================================== */

                .auth-logo {
                    width: calc(100% - 2px);

                    height: 72px;

                    margin: 50px auto 0;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    background:
                        linear-gradient(
                            90deg,
                            #fff8f4 0%,
                            #fff3ed 50%,
                            #fff8f4 100%
                        );

                    border: 1px solid #f2ddd2;

                    border-radius: 4px;

                    position: relative;

                    overflow: hidden;
                }

                .auth-logo::after {
                    content: "";

                    position: absolute;

                    bottom: 0;
                    left: 8%;

                    width: 84%;
                    height: 2px;

                    background:
                        linear-gradient(
                            90deg,
                            transparent,
                            #ff7818,
                            transparent
                        );

                    opacity: 0.30;
                }


                /* =====================================================
                   LOGO IMAGE
                ===================================================== */

                .logo-image {
                    display: block;

                    width: 54px;
                    height: 54px;

                    object-fit: contain;

                    position: relative;

                    z-index: 2;

                    transition:
                        transform 0.25s ease;
                }

                .auth-logo:hover .logo-image {
                    transform: scale(1.05);
                }


                /* =====================================================
                   CONTENT
                ===================================================== */

                .auth-content {
                    width: 100%;

                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    padding:
                        38px
                        28px
                        42px;
                }


                /* =====================================================
                   HEADING
                ===================================================== */

                .auth-heading {
                    width: 100%;
                    max-width: 400px;

                    text-align: center;

                    margin-bottom: 24px;
                }

                .auth-heading h1 {
                    margin: 0;

                    font-size: 28px;

                    line-height: 1.2;

                    font-weight: 500;

                    color: #111111;

                    letter-spacing: -0.4px;
                }

                .auth-heading p {
                    margin:
                        8px
                        0
                        0;

                    font-size: 12px;

                    line-height: 1.5;

                    color: #777777;
                }


                /* =====================================================
                   LOGIN FORM FRAME
                ===================================================== */

                .login-form {
                    width: 100%;
                    max-width: 390px;

                    padding: 28px;

                    background: #ffffff;

                    border: 1px solid #dcdcdc;

                    border-radius: 7px;

                    box-shadow:
                        0 4px 15px
                        rgba(0, 0, 0, 0.025);
                }


                /* =====================================================
                   FORM GROUP
                ===================================================== */

                .form-group {
                    width: 100%;

                    margin-bottom: 19px;
                }

                .form-group label {
                    display: block;

                    margin-bottom: 8px;

                    font-size: 12px;

                    font-weight: 500;

                    color: #222222;
                }

                .form-group input {
                    width: 100%;

                    height: 42px;

                    padding:
                        9px
                        12px;

                    border:
                        1px solid
                        #d2d2d2;

                    border-radius: 5px;

                    outline: none;

                    background: #ffffff;

                    font-size: 12px;

                    color: #222222;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .form-group input::placeholder {
                    color: #999999;
                }

                .form-group input:focus {
                    border-color: #ff7818;

                    box-shadow:
                        0 0 0 3px
                        rgba(255, 120, 24, 0.10);
                }

                /* =====================================================
                   PASSWORD FIELD
                ===================================================== */

                .password-input-wrapper {
                    position: relative;
                    width: 100%;
                }

                .password-input-wrapper input {
                    padding-right: 42px;
                }

                .password-toggle {
                    position: absolute;
                    top: 50%;
                    right: 10px;
                    width: 30px;
                    height: 30px;
                    transform: translateY(-50%);

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    border: none;
                    background: transparent;

                    color: #777777;
                    cursor: pointer;

                    border-radius: 4px;
                    transition:
                        color 0.2s ease,
                        background 0.2s ease;
                }

                .password-toggle:hover {
                    color: #ff7818;
                    background: rgba(255, 120, 24, 0.08);
                }

                .password-toggle:focus-visible {
                    outline: 2px solid rgba(255, 120, 24, 0.35);
                    outline-offset: 1px;
                }

                .password-toggle svg {
                    width: 17px;
                    height: 17px;
                    stroke-width: 2;
                }



                /* =====================================================
                   LOGIN OPTIONS
                ===================================================== */

                .login-options {
                    width: 100%;

                    display: flex;

                    align-items: center;

                    justify-content: space-between;

                    gap: 10px;

                    margin-top: -2px;

                    margin-bottom: 19px;
                }

                .remember-option {
                    display: flex;

                    align-items: center;

                    gap: 6px;

                    font-size: 10px;

                    color: #777777;

                    cursor: pointer;
                }

                .remember-option input {
                    width: 13px;
                    height: 13px;

                    margin: 0;

                    accent-color: #ff7818;

                    cursor: pointer;
                }

                .forgot-password {
                    border: none;

                    padding: 0;

                    background: transparent;

                    color: #ff7818;

                    font-size: 10px;

                    cursor: pointer;

                    white-space: nowrap;
                }

                .forgot-password:hover {
                    text-decoration: underline;
                }


                /* =====================================================
                   SIGN IN BUTTON
                ===================================================== */

                .primary-button {
                    width: 100%;

                    height: 44px;

                    border: none;

                    border-radius: 6px;

                    background:
                        linear-gradient(
                            135deg,
                            #ff7818,
                            #ff6410
                        );

                    color: #ffffff;

                    font-size: 12px;

                    font-weight: 600;

                    cursor: pointer;

                    box-shadow:
                        0 6px 14px
                        rgba(255, 120, 24, 0.15);

                    transition:
                        background 0.2s ease,
                        transform 0.15s ease,
                        box-shadow 0.2s ease;
                }

                .primary-button:hover {
                    background:
                        linear-gradient(
                            135deg,
                            #f96f0f,
                            #f55d08
                        );

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 8px 18px
                        rgba(255, 120, 24, 0.20);
                }

                .primary-button:active {
                    transform:
                        translateY(0);
                }

                .primary-button:disabled {
                    opacity: 0.65;

                    cursor: not-allowed;

                    transform: none;
                }


                /* =====================================================
                   DIVIDER
                ===================================================== */

                .divider {
                    width: 100%;

                    max-width: 390px;

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    margin:
                        21px 0
                        13px;

                    color: #999999;

                    font-size: 10px;
                }

                .divider::before,
                .divider::after {
                    content: "";

                    flex: 1;

                    height: 1px;

                    background: #e6e6e6;
                }

                .divider span {
                    white-space: nowrap;
                }


                /* =====================================================
                   SOCIAL LOGIN
                ===================================================== */

                .social-login {
                    width: 100%;

                    max-width: 390px;

                    display: flex;

                    flex-direction: column;

                    gap: 9px;
                }


                /* =====================================================
                   SOCIAL BUTTON
                ===================================================== */

                .social-button {
                    width: 100%;

                    height: 43px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 10px;

                    border:
                        1px solid
                        #d9d9d9;

                    border-radius: 6px;

                    background: #ffffff;

                    color: #333333;

                    font-size: 11px;

                    font-weight: 500;

                    cursor: pointer;

                    position: relative;

                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        transform 0.15s ease;
                }

                .social-button:hover {
                    background: #ffffff;

                    border-color: #ff7818;

                    box-shadow:
                        0 4px 12px
                        rgba(0, 0, 0, 0.06);

                    transform:
                        translateY(-1px);
                }

                .social-button:active {
                    transform:
                        translateY(0);
                }


                /* =====================================================
                   SOCIAL ICONS
                ===================================================== */

                .social-icon {
                    width: 18px;
                    height: 18px;

                    flex-shrink: 0;
                }

                .google-icon {
                    font-size: 18px;
                }

                .apple-icon {
                    color: #111111;

                    font-size: 17px;
                }


                /* =====================================================
                   REGISTER SECTION
                ===================================================== */

                .account-section {
                    width: 100%;

                    max-width: 390px;

                    margin-top: 27px;

                    padding-top: 20px;

                    border-top:
                        1px solid
                        #eeeeee;

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    text-align: center;
                }

                .account-text {
                    margin: 0 0 13px;

                    font-size: 10px;

                    color: #777777;
                }

                .auth-link {
                    width: 150px;

                    height: 36px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border:
                        1px solid
                        #ff7818;

                    border-radius: 5px;

                    background: #ffffff;

                    color: #ff7818;

                    text-decoration: none;

                    font-size: 10px;

                    font-weight: 600;

                    transition:
                        background 0.2s ease,
                        color 0.2s ease,
                        transform 0.15s ease;
                }

                .auth-link:hover {
                    background: #ff7818;

                    color: #ffffff;

                    transform:
                        translateY(-1px);
                }


                /* =====================================================
                   FOOTER
                ===================================================== */

                .auth-footer {
                    width: 100%;

                    max-width: 390px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 25px;

                    margin-top: 29px;

                    padding-top: 17px;

                    border-top:
                        1px solid
                        #eeeeee;

                    font-size: 9px;

                    color: #999999;
                }

                .auth-footer span {
                    cursor: pointer;

                    transition:
                        color 0.2s ease;
                }

                .auth-footer span:hover {
                    color: #ff7818;
                }


                /* =====================================================
                   POPUP OVERLAY
                ===================================================== */

                .popup-overlay {
                    position: fixed;

                    inset: 0;

                    z-index: 9999;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    padding: 20px;

                    background:
                        rgba(0, 0, 0, 0.38);

                    backdrop-filter: blur(5px);

                    -webkit-backdrop-filter: blur(5px);

                    animation:
                        popupFadeIn
                        0.2s ease;
                }


                /* =====================================================
                   POPUP
                ===================================================== */

                .popup-modal {
                    width: 100%;

                    max-width: 380px;

                    padding:
                        34px
                        30px
                        30px;

                    background: #ffffff;

                    border:
                        1px solid
                        #eeeeee;

                    border-radius: 15px;

                    text-align: center;

                    box-shadow:
                        0 24px 60px
                        rgba(0, 0, 0, 0.18);

                    animation:
                        popupScale
                        0.25s ease;
                }


                /* =====================================================
                   POPUP ICON
                ===================================================== */

                .popup-icon {
                    width: 62px;
                    height: 62px;

                    margin:
                        0 auto
                        17px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    font-size: 27px;

                    font-weight: 700;
                }

                .popup-icon.success {
                    background: #fff3eb;

                    border:
                        2px solid
                        #ff7818;

                    color: #ff7818;
                }

                .popup-icon.error {
                    background: #fff1f1;

                    border:
                        2px solid
                        #e54848;

                    color: #e54848;
                }


                /* =====================================================
                   POPUP TEXT
                ===================================================== */

                .popup-modal h2 {
                    margin: 0;

                    font-size: 20px;

                    font-weight: 600;

                    color: #111111;
                }

                .popup-modal p {
                    margin:
                        9px
                        0
                        0;

                    font-size: 11px;

                    line-height: 1.6;

                    color: #777777;
                }


                /* =====================================================
                   POPUP CLOSE
                ===================================================== */

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

                    box-shadow:
                        0 5px 14px
                        rgba(255, 120, 24, 0.18);

                    transition:
                        background 0.2s ease,
                        transform 0.15s ease;
                }

                .popup-close:hover {
                    background: #f46e0c;

                    transform:
                        translateY(-1px);
                }


                /* =====================================================
                   LOADING
                ===================================================== */

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

                    animation:
                        dotBounce
                        0.8s
                        infinite
                        ease-in-out;
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


                /* =====================================================
                   ANIMATIONS
                ===================================================== */

                @keyframes popupFadeIn {

                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes popupScale {

                    from {
                        opacity: 0;

                        transform:
                            scale(0.94)
                            translateY(8px);
                    }

                    to {
                        opacity: 1;

                        transform:
                            scale(1)
                            translateY(0);
                    }
                }

                @keyframes dotBounce {

                    0%,
                    60%,
                    100% {
                        transform:
                            translateY(0);

                        opacity: 0.45;
                    }

                    30% {
                        transform:
                            translateY(-5px);

                        opacity: 1;
                    }
                }


                /* =====================================================
                   TABLET
                ===================================================== */

                @media (max-width: 768px) {

                    .auth-page {
                        padding: 15px;
                    }

                    .auth-container {
                        min-height:
                            calc(100vh - 30px);

                        min-height:
                            calc(100dvh - 30px);

                        border-radius: 7px;
                    }

                    .auth-logo {
                        width:
                            calc(100% - 30px);

                        margin-top: 50px;
                    }

                    .auth-content {
                        padding:
                            32px
                            22px
                            36px;
                    }

                    .auth-heading h1 {
                        font-size: 26px;
                    }

                    .login-form {
                        max-width: 410px;

                        padding: 26px;
                    }

                    .divider,
                    .social-login,
                    .account-section,
                    .auth-footer {
                        max-width: 410px;
                    }
                }


                /* =====================================================
                   MOBILE
                ===================================================== */

                @media (max-width: 480px) {

                    .auth-page {
                        min-height: 100vh;
                        min-height: 100dvh;

                        padding: 0;

                        align-items: stretch;
                    }

                    .auth-container {
                        width: 100%;

                        min-height: 100vh;
                        min-height: 100dvh;

                        border: none;

                        border-radius: 0;

                        box-shadow: none;
                    }

                    .back-button {
                        top: 12px;
                        left: 10px;

                        width: 36px;
                        height: 36px;

                        font-size: 22px;
                    }

                    .auth-logo {
                        width:
                            calc(100% - 30px);

                        height: 60px;

                        margin-top: 48px;
                    }

                    .logo-image {
                        width: 47px;
                        height: 47px;
                    }

                    .auth-content {
                        padding:
                            30px
                            16px
                            30px;
                    }

                    .auth-heading {
                        margin-bottom: 20px;
                    }

                    .auth-heading h1 {
                        font-size: 24px;
                    }

                    .auth-heading p {
                        font-size: 11px;
                    }

                    .login-form {
                        max-width: 100%;

                        padding: 22px;
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        font-size: 11px;
                    }

                    .form-group input {
                        height: 42px;

                        font-size: 12px;
                    }

                    .remember-option,
                    .forgot-password {
                        font-size: 10px;
                    }

                    .primary-button {
                        height: 43px;

                        font-size: 12px;
                    }

                    .divider {
                        max-width: 100%;
                    }

                    .social-login {
                        max-width: 100%;

                        gap: 8px;
                    }

                    .social-button {
                        height: 42px;

                        font-size: 10px;
                    }

                    .account-section {
                        max-width: 100%;

                        margin-top: 24px;

                        padding-top: 18px;
                    }

                    .auth-footer {
                        max-width: 100%;

                        gap: 18px;

                        margin-top: 25px;

                        font-size: 9px;
                    }

                    .popup-modal {
                        max-width: 350px;

                        padding:
                            30px
                            24px
                            26px;
                    }
                }


                /* =====================================================
                   VERY SMALL PHONES
                ===================================================== */

                @media (max-width: 360px) {

                    .auth-content {
                        padding-left: 12px;

                        padding-right: 12px;
                    }

                    .login-form {
                        padding: 18px;
                    }

                    .login-options {
                        gap: 5px;
                    }

                    .remember-option,
                    .forgot-password {
                        font-size: 9px;
                    }

                    .social-button {
                        font-size: 9px;
                    }

                    .auth-footer {
                        gap: 13px;

                        font-size: 8px;
                    }

                    .auth-link {
                        width: 100%;

                        max-width: 170px;
                    }

                    .popup-modal {
                        padding:
                            27px
                            20px
                            24px;
                    }
                }

            `}</style>


            {/* =====================================================
                POPUP
            ===================================================== */}

            {popup.show && (
                <div className="popup-overlay">

                    <div className="popup-modal">

                        <div
                            className={`popup-icon ${
                                popup.type
                            }`}
                        >
                            {popup.type === "success"
                                ? "✓"
                                : "!"}
                        </div>

                        <h2>
                            {popup.title}
                        </h2>

                        <p>
                            {popup.message}
                        </p>

                        {/* SUCCESS LOADING */}

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

                        {/* ERROR CLOSE BUTTON */}

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


            {/* =====================================================
                LOGIN PAGE
            ===================================================== */}

            <main className="auth-page">

                <div className="auth-container">

                    {/* BACK BUTTON */}

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate("/")}
                        aria-label="Go back"
                    >
                        ←
                    </button>


                    {/* LOGO */}

                    <div className="auth-logo">

                        <img
                            src={logoUrl}
                            alt="GuimarasGo Logo"
                            className="logo-image"
                        />

                        

                    </div>


                    {/* CONTENT */}

                    <div className="auth-content">

                        {/* HEADING */}

                        <div className="auth-heading">

                            <h1>
                                Welcome Back
                            </h1>

                            <p>
                                Sign in to your account to continue
                            </p>

                        </div>


                        {/* LOGIN FORM */}

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >

                            {/* EMAIL */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="form-group">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) =>
                                                    !previous
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


                            {/* LOGIN OPTIONS */}

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

                                    <span>
                                        Remember me
                                    </span>

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


                            {/* SIGN IN */}

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing In..."
                                    : "Sign In"}
                            </button>

                        </form>


                        {/* DIVIDER */}

                        <div className="divider">

                            <span>
                                Or continue with
                            </span>

                        </div>


                        {/* SOCIAL LOGIN */}

                        <div className="social-login">

                            {/* GOOGLE */}

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

                                <FcGoogle
                                    className="social-icon google-icon"
                                />

                                <span>
                                    Continue with Google
                                </span>

                            </button>


                            {/* APPLE */}

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

                                <FaApple
                                    className="social-icon apple-icon"
                                />

                                <span>
                                    Continue with Apple
                                </span>

                            </button>

                        </div>


                        {/* REGISTER */}

                        <div className="account-section">

                            <p className="account-text">
                                Don't have an account?
                            </p>

                            <Link
                                to="/register"
                                className="auth-link"
                            >
                                Create an account
                            </Link>

                        </div>


                        {/* FOOTER */}

                        <div className="auth-footer">

                            <span>
                                Privacy Policy
                            </span>

                            <span>
                                Terms of Service
                            </span>

                            <span>
                                Help Center
                            </span>

                        </div>

                    </div>

                </div>

            </main>
        </>
    );
};

export default Login;