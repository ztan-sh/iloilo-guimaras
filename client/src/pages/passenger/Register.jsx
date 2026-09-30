import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";


const Register = () => {
    const navigate = useNavigate();

    // =========================================================
    // FORM DATA
    // =========================================================

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
    });

    const [loading, setLoading] = useState(false);

    // =========================================================
    // POPUP STATE
    // =========================================================

    const [popup, setPopup] = useState({
        show: false,
        type: "",
        title: "",
        message: "",
    });

    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // =========================================================
    // SHOW POPUP
    // =========================================================

    const showPopup = (
        type,
        title,
        message
    ) => {
        setPopup({
            show: true,
            type,
            title,
            message,
        });
    };

    // =========================================================
    // CLOSE POPUP
    // =========================================================

    const closePopup = () => {
        setPopup({
            show: false,
            type: "",
            title: "",
            message: "",
        });
    };

    // =========================================================
    // PASSWORD REQUIREMENTS
    // =========================================================

    const passwordRequirements = {
        minLength: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password),
    };

    // =========================================================
    // HANDLE REGISTRATION
    // =========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        // =====================================================
        // PASSWORD VALIDATION
        // =====================================================

        if (
            !passwordRequirements.minLength ||
            !passwordRequirements.uppercase ||
            !passwordRequirements.lowercase ||
            !passwordRequirements.number ||
            !passwordRequirements.special
        ) {
            showPopup(
                "warning",
                "Password Requirements",
                "Please make sure your password meets all of the requirements shown below."
            );

            return;
        }

        if (
            formData.password !==
            formData.confirmPassword
        ) {
            showPopup(
                "error",
                "Passwords Don't Match",
                "Your passwords do not match. Please check your password and try again."
            );

            return;
        }

        // =====================================================
        // TERMS VALIDATION
        // =====================================================

        if (!formData.agreeTerms) {
            showPopup(
                "warning",
                "Terms Required",
                "Please agree to the Terms of Service and Privacy Policy before creating your account."
            );

            return;
        }

        // =====================================================
        // START LOADING
        // =====================================================

        try {
            setLoading(true);

            /*
             * BACKEND CONNECTION
             * Same endpoint and same data.
             */

            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        fullName:
                            formData.fullName,

                        email:
                            formData.email,

                        phoneNumber:
                            formData.phoneNumber,

                        password:
                            formData.password,
                    }),
                }
            );

            const data =
                await response.json();

            // =================================================
            // BACKEND ERROR
            // =================================================

            if (!response.ok) {
                showPopup(
                    "error",
                    "Registration Failed",
                    data.message ||
                        "We were unable to create your account. Please check your information and try again."
                );

                return;
            }

            // =================================================
            // SUCCESS
            // =================================================

            setFormData({
                fullName: "",
                email: "",
                phoneNumber: "",
                password: "",
                confirmPassword: "",
                agreeTerms: false,
            });

            showPopup(
                "success",
                "Account Created!",
                "Your GuimarasGo account has been created successfully. Redirecting you to the login page..."
            );

            // =================================================
            // GO TO LOGIN AFTER SUCCESS MESSAGE
            // =================================================

            setTimeout(() => {
                navigate("/login");
            }, 1800);

        } catch (error) {
            console.error(
                "Registration Error:",
                error
            );

            showPopup(
                "error",
                "Connection Error",
                "Unable to connect to the server. Please make sure the backend is running and try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // PAGE
    // =========================================================

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

                    background: #f7f7f7;

                    color: #111;
                }


                /* =====================================================
                   PAGE
                ===================================================== */

                .register-page {
                    width: 100%;

                    min-height: 100vh;
                    min-height: 100dvh;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    padding: 30px;

                    background:
                        linear-gradient(
                            135deg,
                            #fffaf7 0%,
                            #f7f7f7 50%,
                            #f8fff5 100%
                        );
                }


                /* =====================================================
                   MAIN CONTAINER
                ===================================================== */

                .register-container {
                    position: relative;

                    width: 100%;

                    max-width: 1100px;

                    background: #ffffff;

                    border:
                        1px solid #dedede;

                    border-radius: 10px;

                    overflow: hidden;

                    box-shadow:
                        0 15px 45px
                        rgba(0, 0, 0, 0.08);

                    display: flex;

                    flex-direction: column;

                    align-items: center;
                }


                /* =====================================================
                   BACK BUTTON
                ===================================================== */

                .register-back-button {
                    position: absolute;

                    top: 20px;
                    left: 20px;

                    width: 38px;
                    height: 38px;

                    border:
                        1px solid #e4e4e4;

                    border-radius: 50%;

                    background: #ffffff;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    font-size: 20px;

                    color: #444;

                    cursor: pointer;

                    z-index: 10;

                    transition:
                        0.2s ease;
                }

                .register-back-button:hover {
                    color: #ff7818;

                    border-color:
                        #ff7818;

                    transform:
                        translateX(-2px);
                }


                /* =====================================================
                   LOGO HEADER
                ===================================================== */

                .register-logo-header {
                    width:
                        calc(100% - 70px);

                    min-height: 78px;

                    margin-top: 80px;

                    padding: 10px 20px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background:
                        linear-gradient(
                            135deg,
                            #fff4ed,
                            #fff9f5
                        );

                    border:
                        1px solid #f5dfd3;

                    border-radius: 8px;
                }


                /* =====================================================
                   LOGO
                ===================================================== */

                .register-logo-image {
                    width: 58px;

                    height: 58px;

                    object-fit: contain;

                    display: block;
                }


                /* =====================================================
                   CONTENT
                ===================================================== */

                .register-content {
                    width: 100%;

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    padding:
                        30px
                        20px
                        45px;
                }


                /* =====================================================
                   HEADING
                ===================================================== */

                .register-heading {
                    width: 100%;

                    max-width: 440px;

                    text-align: center;

                    margin-bottom: 24px;
                }

                .register-heading h1 {
                    margin: 0;

                    font-size: 28px;

                    line-height: 1.2;

                    font-weight: 600;

                    color: #111;
                }

                .register-heading p {
                    margin:
                        9px 0 0;

                    font-size: 13px;

                    line-height: 1.5;

                    color: #777;
                }


                /* =====================================================
                   FORM
                ===================================================== */

                .register-form {
                    width: 100%;

                    max-width: 430px;

                    padding: 26px;

                    background: #ffffff;

                    border:
                        1px solid #dedede;

                    border-radius: 8px;

                    box-shadow:
                        0 8px 25px
                        rgba(0, 0, 0, 0.04);
                }


                /* =====================================================
                   FORM GROUP
                ===================================================== */

                .register-form-group {
                    width: 100%;

                    margin-bottom: 16px;
                }

                .register-form-group label {
                    display: block;

                    margin-bottom: 7px;

                    font-size: 12px;

                    font-weight: 600;

                    color: #333;
                }

                .register-form-group input {
                    width: 100%;

                    height: 43px;

                    padding:
                        9px 12px;

                    border:
                        1px solid #d5d5d5;

                    border-radius: 5px;

                    outline: none;

                    background: #ffffff;

                    font-size: 12px;

                    color: #222;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .register-form-group input::placeholder {
                    color: #aaa;
                }

                .register-form-group input:focus {
                    border-color:
                        #ff7818;

                    box-shadow:
                        0 0 0 3px
                        rgba(
                            255,
                            120,
                            24,
                            0.10
                        );
                }


                /* =====================================================
                   PASSWORD REQUIREMENTS
                ===================================================== */

                .register-password-requirements {
                    width: 100%;
                    margin: -4px 0 18px;
                    padding: 11px 12px;
                    border: 1px solid #eeeeee;
                    border-radius: 7px;
                    background: #fafafa;
                }

                .register-password-requirements-title {
                    margin: 0 0 8px;
                    color: #555;
                    font-size: 10px;
                    font-weight: 600;
                }

                .register-password-checklist {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px 12px;
                }

                .password-check-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                    color: #888;
                    font-size: 9px;
                    line-height: 1.4;
                    transition: color 0.2s ease;
                }

                .password-check-item.valid {
                    color: #229447;
                }

                .password-check-icon {
                    width: 15px;
                    height: 15px;
                    flex: 0 0 15px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #eeeeee;
                    color: #999;
                    font-size: 9px;
                    font-weight: 700;
                }

                .password-check-item.valid .password-check-icon {
                    background: #e8f7ed;
                    color: #229447;
                }


                /* =====================================================
                   TERMS
                ===================================================== */

                .register-terms {
                    width: 100%;

                    display: flex;

                    align-items: flex-start;

                    gap: 9px;

                    margin:
                        4px 0 20px;

                    font-size: 11px;

                    line-height: 1.5;

                    color: #777;

                    cursor: pointer;
                }

                .register-terms input {
                    width: 15px;
                    height: 15px;

                    margin:
                        1px 0 0;

                    flex-shrink: 0;

                    accent-color:
                        #ff7818;

                    cursor: pointer;
                }

                .register-terms a {
                    color:
                        #ff7818;

                    text-decoration: none;

                    font-weight: 500;
                }

                .register-terms a:hover {
                    text-decoration: underline;
                }


                /* =====================================================
                   CREATE ACCOUNT BUTTON
                ===================================================== */

                .register-primary-button {
                    width: 100%;

                    height: 44px;

                    border: none;

                    border-radius: 5px;

                    background:
                        linear-gradient(
                            135deg,
                            #ff7818,
                            #ff941f
                        );

                    color: #ffffff;

                    font-size: 13px;

                    font-weight: 600;

                    cursor: pointer;

                    transition:
                        0.2s ease;
                }

                .register-primary-button:hover {
                    background:
                        linear-gradient(
                            135deg,
                            #f46e0c,
                            #ff8614
                        );

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 6px 15px
                        rgba(
                            255,
                            120,
                            24,
                            0.20
                        );
                }

                .register-primary-button:active {
                    transform:
                        translateY(0);
                }

                .register-primary-button:disabled {
                    opacity: 0.65;

                    cursor:
                        not-allowed;

                    transform: none;

                    box-shadow: none;
                }


                /* =====================================================
                   DIVIDER
                ===================================================== */

                .register-divider {
                    width: 100%;

                    max-width: 430px;

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    margin:
                        20px 0 14px;

                    color: #999;

                    font-size: 10px;
                }

                .register-divider::before,
                .register-divider::after {
                    content: "";

                    flex: 1;

                    height: 1px;

                    background:
                        #e5e5e5;
                }

                .register-divider span {
                    white-space: nowrap;
                }


                /* =====================================================
                   SOCIAL REGISTRATION
                ===================================================== */

                .register-social-login {
                    width: 100%;

                    max-width: 430px;

                    display: flex;

                    gap: 10px;
                }

                .register-social-button {
                    flex: 1;

                    min-height: 43px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 9px;

                    border:
                        1px solid #dcdcdc;

                    border-radius: 5px;

                    background: #ffffff;

                    color: #333;

                    font-size: 11px;

                    font-weight: 500;

                    cursor: pointer;

                    transition:
                        0.2s ease;
                }

                .register-social-button:hover {
                    background: #fafafa;

                    border-color:
                        #ff7818;

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 4px 12px
                        rgba(
                            0,
                            0,
                            0,
                            0.06
                        );
                }

                .register-social-icon {
                    width: 19px;

                    height: 19px;

                    flex-shrink: 0;
                }

                .register-apple-icon {
                    color: #111;

                    font-size: 19px;
                }


                /* =====================================================
                   REGISTRATION TYPE
                ===================================================== */

                .register-type-section {
                    width: 100%;
                    max-width: 440px;
                    margin-bottom: 24px;
                }

                .register-type-title {
                    margin: 0 0 10px;
                    text-align: center;
                    font-size: 13px;
                    font-weight: 600;
                    color: #555;
                }

                .register-type-options {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }

                .register-type-option {
                    min-height: 78px;
                    padding: 12px;
                    border: 1px solid #dedede;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #222;
                    text-align: left;
                    cursor: pointer;
                    transition: 0.2s ease;
                }

                .register-type-option:hover {
                    border-color: #ff7818;
                    transform: translateY(-1px);
                }

                .register-type-option-active {
                    border-color: #ff7818;
                    background: #fff7f1;
                }

                .register-type-option-title {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 14px;
                    font-weight: 700;
                }

                .register-type-option-description {
                    display: block;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #777;
                }


                /* =====================================================
                   LOGIN SECTION
                ===================================================== */

                .register-login-section {
                    text-align: center;

                    margin-top: 25px;
                }

                .register-login-text {
                    margin:
                        0 0 7px;

                    font-size: 11px;

                    color: #777;
                }

                .register-login-link {
                    color:
                        #ff7818;

                    font-size: 12px;

                    font-weight: 600;

                    text-decoration: none;
                }

                .register-login-link:hover {
                    text-decoration: underline;
                }


                /* =====================================================
                   FOOTER
                ===================================================== */

                .register-footer {
                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 28px;

                    margin-top: 30px;

                    font-size: 9px;

                    color: #aaa;
                }

                .register-footer span {
                    cursor: pointer;

                    transition:
                        color 0.2s ease;
                }

                .register-footer span:hover {
                    color:
                        #ff7818;
                }


                /* =====================================================
                   LOADING OVERLAY
                ===================================================== */

                .register-loading-overlay {
                    position: fixed;

                    inset: 0;

                    z-index: 9999;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    background:
                        rgba(
                            17,
                            17,
                            17,
                            0.45
                        );

                    backdrop-filter:
                        blur(5px);

                    -webkit-backdrop-filter:
                        blur(5px);
                }

                .register-loading-card {
                    width: min(
                        350px,
                        calc(100% - 40px)
                    );

                    padding:
                        32px 25px;

                    background:
                        #ffffff;

                    border-radius:
                        18px;

                    text-align:
                        center;

                    box-shadow:
                        0 20px 60px
                        rgba(
                            0,
                            0,
                            0,
                            0.20
                        );

                    animation:
                        popupIn
                        0.25s ease;
                }

                .loading-spinner {
                    width: 48px;

                    height: 48px;

                    margin:
                        0 auto 18px;

                    border:
                        4px solid
                        #ffe0c8;

                    border-top-color:
                        #ff7818;

                    border-radius:
                        50%;

                    animation:
                        spin
                        0.8s linear infinite;
                }

                .register-loading-card h2 {
                    margin:
                        0 0 7px;

                    color: #111;

                    font-size: 18px;
                }

                .register-loading-card p {
                    margin: 0;

                    color: #777;

                    font-size: 12px;

                    line-height: 1.5;
                }


                /* =====================================================
                   POPUP OVERLAY
                ===================================================== */

                .register-popup-overlay {
                    position: fixed;

                    inset: 0;

                    z-index: 10000;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 20px;

                    background:
                        rgba(
                            17,
                            17,
                            17,
                            0.45
                        );

                    backdrop-filter:
                        blur(5px);

                    -webkit-backdrop-filter:
                        blur(5px);

                    animation:
                        fadeIn
                        0.2s ease;
                }


                /* =====================================================
                   POPUP CARD
                ===================================================== */

                .register-popup {
                    width: min(
                        390px,
                        100%
                    );

                    padding:
                        32px 28px 26px;

                    background:
                        #ffffff;

                    border-radius:
                        20px;

                    text-align:
                        center;

                    box-shadow:
                        0 20px 65px
                        rgba(
                            0,
                            0,
                            0,
                            0.22
                        );

                    animation:
                        popupIn
                        0.25s ease;
                }


                /* =====================================================
                   POPUP ICON
                ===================================================== */

                .popup-icon {
                    width: 64px;

                    height: 64px;

                    margin:
                        0 auto 17px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius:
                        50%;

                    font-size: 28px;

                    font-weight: 700;
                }

                .popup-icon.success {
                    background:
                        #e9f9ef;

                    color:
                        #20a35a;
                }

                .popup-icon.error {
                    background:
                        #fff0f0;

                    color:
                        #e04444;
                }

                .popup-icon.warning {
                    background:
                        #fff6e8;

                    color:
                        #ed921e;
                }


                /* =====================================================
                   POPUP TEXT
                ===================================================== */

                .register-popup h2 {
                    margin:
                        0 0 9px;

                    color:
                        #111;

                    font-size:
                        21px;

                    font-weight:
                        700;
                }

                .register-popup p {
                    margin:
                        0;

                    color:
                        #777;

                    font-size:
                        12px;

                    line-height:
                        1.6;
                }


                /* =====================================================
                   POPUP BUTTON
                ===================================================== */

                .popup-button {
                    width:
                        100%;

                    height:
                        43px;

                    margin-top:
                        23px;

                    border:
                        none;

                    border-radius:
                        8px;

                    background:
                        #ff7818;

                    color:
                        #ffffff;

                    font-size:
                        12px;

                    font-weight:
                        600;

                    cursor:
                        pointer;

                    transition:
                        0.2s ease;
                }

                .popup-button:hover {
                    background:
                        #f46e0c;

                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 6px 16px
                        rgba(
                            255,
                            120,
                            24,
                            0.20
                        );
                }


                /* =====================================================
                   ANIMATIONS
                ===================================================== */

                @keyframes spin {
                    from {
                        transform:
                            rotate(0deg);
                    }

                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes popupIn {
                    from {
                        opacity: 0;

                        transform:
                            translateY(12px)
                            scale(0.96);
                    }

                    to {
                        opacity: 1;

                        transform:
                            translateY(0)
                            scale(1);
                    }
                }


                /* =====================================================
                   TABLET
                ===================================================== */

                @media (max-width: 768px) {

                    .register-page {
                        padding: 20px;
                    }

                    .register-container {
                        border-radius: 8px;
                    }

                    .register-logo-header {
                        width:
                            calc(100% - 40px);

                        margin-top: 25px;
                    }

                    .register-content {
                        padding:
                            28px
                            18px
                            35px;
                    }

                    .register-form {
                        max-width: 500px;
                    }

                    .register-divider,
                    .register-social-login {
                        max-width: 500px;
                    }
                }


                .register-password-checklist {
                    grid-template-columns: 1fr;
                }


                /* =====================================================
                   MOBILE
                ===================================================== */

                @media (max-width: 480px) {

                    .register-page {
                        padding: 0;

                        align-items:
                            stretch;
                    }

                    .register-container {
                        width: 100%;

                        min-height: 100vh;
                        min-height: 100dvh;

                        border: none;

                        border-radius: 0;

                        box-shadow: none;
                    }

                    .register-back-button {
                        top: 14px;

                        left: 12px;

                        width: 35px;

                        height: 35px;

                        font-size: 19px;
                    }

                    .register-logo-header {
                        width:
                            calc(100% - 30px);

                        min-height: 70px;

                        margin-top: 55px;
                    }

                    .register-logo-image {
                        width: 52px;

                        height: 52px;
                    }

                    .register-content {
                        padding:
                            28px
                            15px
                            30px;
                    }

                    .register-heading {
                        margin-bottom: 20px;
                    }

                    .register-heading h1 {
                        font-size: 24px;
                    }

                    .register-heading p {
                        font-size: 11px;
                    }

                    .register-form {
                        max-width: 100%;

                        padding: 20px;
                    }

                    .register-form-group {
                        margin-bottom: 15px;
                    }

                    .register-form-group label {
                        font-size: 11px;
                    }

                    .register-form-group input {
                        height: 42px;

                        font-size: 12px;
                    }

                    .register-terms {
                        font-size: 10px;
                    }

                    .register-primary-button {
                        height: 43px;
                    }

                    .register-social-login {
                        max-width: 100%;

                        flex-direction: column;

                        gap: 8px;
                    }

                    .register-social-button {
                        width: 100%;

                        min-height: 42px;

                        font-size: 11px;
                    }

                    .register-footer {
                        gap: 18px;

                        margin-top: 25px;
                    }

                    .register-popup {
                        padding:
                            28px 22px 23px;
                    }

                    .popup-icon {
                        width: 58px;

                        height: 58px;

                        font-size: 25px;
                    }

                    .register-popup h2 {
                        font-size: 19px;
                    }

                    .register-popup p {
                        font-size: 11px;
                    }
                }


                /* =====================================================
                   VERY SMALL PHONES
                ===================================================== */

                @media (max-width: 360px) {

                    .register-content {
                        padding-left: 12px;

                        padding-right: 12px;
                    }

                    .register-form {
                        padding: 17px;
                    }

                    .register-footer {
                        gap: 13px;

                        font-size: 8px;
                    }
                }


                @media (max-width: 560px) {
                    .register-type-options {
                        grid-template-columns: 1fr;
                    }
                }

            `}</style>


            {/* =====================================================
               MAIN PAGE
            ===================================================== */}

            <main className="register-page">

                <div className="register-container">

                    {/* =================================================
                       BACK BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className="register-back-button"
                        onClick={() =>
                            navigate("/Login")
                        }
                        aria-label="Go back"
                    >
                        ←
                    </button>


                    {/* =================================================
                       LOGO
                    ================================================= */}

                    <div className="register-logo-header">

                        <img
                            src="/images/guimarasgo-logo.png"
                            alt="GuimarasGo Logo"
                            className="register-logo-image"
                        />

                    </div>


                    {/* =================================================
                       CONTENT
                    ================================================= */}

                    <div className="register-content">

                        {/* HEADING */}

                        <div className="register-heading">

                            <h1>
                                Create Account
                            </h1>

                            <p>
                                Create your account to reserve
                                your ferry trip.
                            </p>

                        </div>


                        {/* =================================================
                           REGISTRATION FORM
                        ================================================= */}

                        {/* =================================================
                           REGISTRATION TYPE
                        ================================================= */}

                        <div className="register-type-section">
                            <p className="register-type-title">
                                Choose Account Type
                            </p>

                            <div className="register-type-options">

                                <button
                                    type="button"
                                    className="register-type-option register-type-option-active"
                                >
                                    <span className="register-type-option-title">
                                        Passenger
                                    </span>

                                    <span className="register-type-option-description">
                                        Register to book ferry trips.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="register-type-option"
                                    onClick={() =>
                                        navigate("/admin-register")
                                    }
                                >
                                    <span className="register-type-option-title">
                                        Administrator
                                    </span>

                                    <span className="register-type-option-description">
                                        Requires an Admin Registration Code.
                                    </span>
                                </button>

                            </div>
                        </div>


                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >

                            {/* FULL NAME */}

                            <div className="register-form-group">

                                <label htmlFor="fullName">
                                    Full Name
                                </label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={
                                        formData.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="name"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="register-form-group">

                                <label htmlFor="registerEmail">
                                    Email Address
                                </label>

                                <input
                                    id="registerEmail"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            {/* PHONE NUMBER */}

                            <div className="register-form-group">

                                <label htmlFor="phoneNumber">
                                    Phone Number
                                </label>

                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="09XXXXXXXXX"
                                    value={
                                        formData.phoneNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="tel"
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="register-form-group">

                                <label htmlFor="registerPassword">
                                    Password
                                </label>

                                <input
                                    id="registerPassword"
                                    name="password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                            </div>


                            {/* PASSWORD REQUIREMENTS */}

                            <div className="register-password-requirements">

                                <p className="register-password-requirements-title">
                                    Password requirements
                                </p>

                                <div className="register-password-checklist">

                                    <div className={passwordRequirements.minLength ? "password-check-item valid" : "password-check-item"}>
                                        <span className="password-check-icon">
                                            {passwordRequirements.minLength ? "✓" : "○"}
                                        </span>
                                        <span>At least 8 characters</span>
                                    </div>

                                    <div className={passwordRequirements.uppercase ? "password-check-item valid" : "password-check-item"}>
                                        <span className="password-check-icon">
                                            {passwordRequirements.uppercase ? "✓" : "○"}
                                        </span>
                                        <span>One uppercase letter</span>
                                    </div>

                                    <div className={passwordRequirements.lowercase ? "password-check-item valid" : "password-check-item"}>
                                        <span className="password-check-icon">
                                            {passwordRequirements.lowercase ? "✓" : "○"}
                                        </span>
                                        <span>One lowercase letter</span>
                                    </div>

                                    <div className={passwordRequirements.number ? "password-check-item valid" : "password-check-item"}>
                                        <span className="password-check-icon">
                                            {passwordRequirements.number ? "✓" : "○"}
                                        </span>
                                        <span>One number</span>
                                    </div>

                                    <div className={passwordRequirements.special ? "password-check-item valid" : "password-check-item"}>
                                        <span className="password-check-icon">
                                            {passwordRequirements.special ? "✓" : "○"}
                                        </span>
                                        <span>One special character</span>
                                    </div>

                                </div>

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="register-form-group">

                                <label htmlFor="confirmPassword">
                                    Confirm Password
                                </label>

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={
                                        formData.confirmPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                            </div>


                            {/* TERMS */}

                            <label className="register-terms">

                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={
                                        formData.agreeTerms
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                                <span>

                                    I agree to the{" "}

                                    <a
                                        href="#terms"
                                        onClick={(
                                            event
                                        ) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        Terms of Service
                                    </a>

                                    {" "}and{" "}

                                    <a
                                        href="#privacy"
                                        onClick={(
                                            event
                                        ) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        Privacy Policy
                                    </a>.

                                </span>

                            </label>


                            {/* CREATE ACCOUNT */}

                            <button
                                type="submit"
                                className="register-primary-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Account..."
                                    : "Create Account"}
                            </button>

                        </form>


                        {/* =================================================
                           DIVIDER
                        ================================================= */}

                        <div className="register-divider">

                            <span>
                                Or continue with
                            </span>

                        </div>


                        {/* =================================================
                           SOCIAL REGISTRATION
                        ================================================= */}

                        <div className="register-social-login">

                            <button
                                type="button"
                                className="register-social-button"
                                onClick={() =>
                                    showPopup(
                                        "warning",
                                        "Coming Soon",
                                        "Google registration will be added later."
                                    )
                                }
                            >

                                <FcGoogle
                                    className="register-social-icon"
                                />

                                <span>
                                    Continue with Google
                                </span>

                            </button>


                            <button
                                type="button"
                                className="register-social-button"
                                onClick={() =>
                                    showPopup(
                                        "warning",
                                        "Coming Soon",
                                        "Apple registration will be added later."
                                    )
                                }
                            >

                                <FaApple
                                    className="register-social-icon register-apple-icon"
                                />

                                <span>
                                    Continue with Apple
                                </span>

                            </button>

                        </div>


                        {/* =================================================
                           LOGIN
                        ================================================= */}

                        <div className="register-login-section">

                            <p className="register-login-text">
                                Already have an account?
                            </p>

                            <Link
                                to="/login"
                                className="register-login-link"
                            >
                                Sign In
                            </Link>

                        </div>


                        {/* =================================================
                           FOOTER
                        ================================================= */}

                        <div className="register-footer">

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


            {/* =========================================================
               LOADING POPUP
            ========================================================= */}

            {loading && (

                <div className="register-loading-overlay">

                    <div className="register-loading-card">

                        <div className="loading-spinner" />

                        <h2>
                            Creating your account...
                        </h2>

                        <p>
                            Please wait while we securely
                            create your GuimarasGo account.
                        </p>

                    </div>

                </div>

            )}


            {/* =========================================================
               RESULT POPUP
            ========================================================= */}

            {popup.show && (

                <div
                    className="register-popup-overlay"
                    onClick={() => {
                        if (
                            popup.type !==
                            "success"
                        ) {
                            closePopup();
                        }
                    }}
                >

                    <div
                        className="register-popup"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* ICON */}

                        <div
                            className={`popup-icon ${popup.type}`}
                        >

                            {popup.type ===
                                "success" && (
                                <span>✓</span>
                            )}

                            {popup.type ===
                                "error" && (
                                <span>!</span>
                            )}

                            {popup.type ===
                                "warning" && (
                                <span>!</span>
                            )}

                        </div>


                        {/* TITLE */}

                        <h2>
                            {popup.title}
                        </h2>


                        {/* MESSAGE */}

                        <p>
                            {popup.message}
                        </p>


                        {/* BUTTON */}

                        {popup.type !==
                            "success" && (

                            <button
                                type="button"
                                className="popup-button"
                                onClick={
                                    closePopup
                                }
                            >
                                Okay
                            </button>

                        )}

                    </div>

                </div>

            )}

        </>
    );
};

export default Register;