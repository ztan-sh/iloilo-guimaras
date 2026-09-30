import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const AdminRegister = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        registrationCode: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showRegistrationCode, setShowRegistrationCode] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/admin/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed."
                );
            }

            setSuccess(
                "Administrator account created successfully!"
            );

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="admin-register-page">
            <section className="admin-register-shell">
                {/* LEFT VISUAL PANEL */}
                <div className="admin-register-visual">
                    <div className="visual-overlay" />

                    <button
                        type="button"
                        className="visual-back-button"
                        onClick={() => navigate("/register")}
                    >
                        ← Back
                    </button>

                    <img
                        className="visual-logo"
                        src="/images/guimarasgo-logo.png"
                        alt="GuimarasGo"
                    />

                    <div className="visual-copy">
                        <h2>
                            Secure the system.
                            <br />
                            <span>Manage the crossing.</span>
                        </h2>

                        <p>
                            Create your administrator account to manage
                            GuimarasGo securely and efficiently.
                        </p>
                    </div>
                </div>

                {/* RIGHT FORM PANEL */}
                <div className="admin-register-form-panel">
                    <div className="admin-register-form-content">
                        <header className="form-header">
                            <h1>Create your account</h1>

                            <p>
                                Already have one?{" "}
                                <button
                                    type="button"
                                    className="inline-link"
                                    onClick={() => navigate("/login")}
                                >
                                    Log in
                                </button>
                            </p>
                        </header>

                        {error && (
                            <div
                                className="status-message error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                className="status-message success"
                                role="status"
                            >
                                {success}
                            </div>
                        )}

                        <form
                            className="admin-register-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="field-group">
                                <label htmlFor="fullName">
                                    Full name
                                </label>

                                <input
                                    id="fullName"
                                    type="text"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Full name"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="email">
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="password-field">
                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (value) => !value
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            <div className="field-group">
                                <label htmlFor="confirmPassword">
                                    Confirm password
                                </label>

                                <div className="password-field">
                                    <input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (value) => !value
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showConfirmPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>
                                </div>
                            </div>

                            <div className="field-group">
                                <label htmlFor="registrationCode">
                                    Admin code
                                </label>

                                <div className="password-field">
                                    <input
                                        id="registrationCode"
                                        type={
                                            showRegistrationCode
                                                ? "text"
                                                : "password"
                                        }
                                        name="registrationCode"
                                        value={
                                            form.registrationCode
                                        }
                                        onChange={handleChange}
                                        placeholder="Admin registration code"
                                        autoComplete="off"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowRegistrationCode(
                                                (value) => !value
                                            )
                                        }
                                        aria-label={
                                            showRegistrationCode
                                                ? "Hide admin code"
                                                : "Show admin code"
                                        }
                                    >
                                        {showRegistrationCode
                                            ? "Hide"
                                            : "Show"}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="create-account-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create account"}
                            </button>
                        </form>

                        <p className="bottom-login">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                            >
                                Log in
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .admin-register-page {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 30px 24px;
                    background: #205b58;
                    font-family:
                        Inter,
                        Poppins,
                        Arial,
                        Helvetica,
                        sans-serif;
                }

                .admin-register-shell {
                    width: min(1120px, 100%);
                    min-height: 620px;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(390px, 0.92fr);
                    background: #1d1d1b;
                    overflow: hidden;
                    border-radius: 0;
                    box-shadow: none;
                }

                /* ------------------------------
                   LEFT VISUAL
                ------------------------------ */

                .admin-register-visual {
                    position: relative;
                    min-height: 620px;
                    margin: 36px 0 36px 36px;
                    overflow: hidden;
                    border-radius: 16px;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.08),
                            rgba(0, 0, 0, 0.58)
                        ),
                        url("/images/register/register-background.jpg")
                            center / cover no-repeat;
                }

                .visual-overlay {
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.06) 0%,
                            rgba(0, 0, 0, 0.02) 45%,
                            rgba(0, 0, 0, 0.62) 100%
                        );
                    pointer-events: none;
                }

                .visual-back-button {
                    position: absolute;
                    top: 18px;
                    left: 18px;
                    z-index: 3;
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    border-radius: 999px;
                    padding: 9px 14px;
                    background: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        transform 0.2s ease;
                }

                .visual-back-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.55);
                    transform: translateY(-1px);
                }

                .visual-logo {
                    position: absolute;
                    top: 18px;
                    right: 20px;
                    z-index: 3;
                    width: 54px;
                    height: 44px;
                    object-fit: contain;
                    display: block;
                }

                .visual-copy {
                    position: absolute;
                    z-index: 2;
                    left: 32px;
                    right: 30px;
                    bottom: 30px;
                    color: #ffffff;
                }

                .visual-copy h2 {
                    margin: 0;
                    font-size: clamp(30px, 3vw, 46px);
                    line-height: 0.98;
                    letter-spacing: -1.5px;
                    font-weight: 800;
                }

                .visual-copy h2 span {
                    color: #ff8c2b;
                    font-family: Georgia, "Times New Roman", serif;
                    font-style: italic;
                    font-weight: 700;
                }

                .visual-copy p {
                    max-width: 390px;
                    margin: 18px 0 0;
                    color: rgba(255, 255, 255, 0.92);
                    font-size: 13px;
                    line-height: 1.45;
                }

                /* ------------------------------
                   RIGHT FORM
                ------------------------------ */

                .admin-register-form-panel {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 52px 56px 52px 54px;
                    background: #1d1d1b;
                }

                .admin-register-form-content {
                    width: min(100%, 440px);
                }

                .form-header {
                    margin-bottom: 34px;
                }

                .form-header h1 {
                    margin: 0;
                    color: #ffffff;
                    font-size: clamp(32px, 3vw, 43px);
                    line-height: 1.05;
                    font-weight: 500;
                    letter-spacing: -1.2px;
                }

                .form-header p {
                    margin: 9px 0 0;
                    color: rgba(255, 255, 255, 0.76);
                    font-size: 12px;
                }

                .inline-link {
                    padding: 0;
                    border: 0;
                    background: transparent;
                    color: #ffffff;
                    text-decoration: underline;
                    cursor: pointer;
                    font: inherit;
                }

                .status-message {
                    margin-bottom: 16px;
                    padding: 11px 13px;
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .status-message.error {
                    color: #ffd9d9;
                    background: rgba(220, 38, 38, 0.18);
                    border: 1px solid rgba(248, 113, 113, 0.25);
                }

                .status-message.success {
                    color: #d8ffe4;
                    background: rgba(22, 163, 74, 0.18);
                    border: 1px solid rgba(74, 222, 128, 0.25);
                }

                .admin-register-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .field-group label {
                    color: rgba(255, 255, 255, 0.86);
                    font-size: 12px;
                    font-weight: 500;
                }

                .field-group > input,
                .password-field input {
                    width: 100%;
                    height: 46px;
                    border: 1px solid transparent;
                    border-radius: 7px;
                    outline: none;
                    padding: 0 16px;
                    background: #5a5a5a;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 12px;
                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        background 0.2s ease;
                }

                .field-group input::placeholder {
                    color: rgba(255, 255, 255, 0.8);
                }

                .field-group > input:focus,
                .password-field:focus-within input {
                    background: #626262;
                    border-color: #ff922f;
                    box-shadow: 0 0 0 2px rgba(255, 146, 47, 0.12);
                }

                .password-field {
                    position: relative;
                }

                .password-field input {
                    padding-right: 58px;
                }

                .password-toggle {
                    position: absolute;
                    top: 50%;
                    right: 9px;
                    transform: translateY(-50%);
                    border: 0;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 5px;
                }

                .password-toggle:hover {
                    color: #ffffff;
                }

                .create-account-button {
                    width: 100%;
                    height: 46px;
                    margin-top: 6px;
                    border: 0;
                    border-radius: 999px;
                    background: #ff922f;
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition:
                        background 0.2s ease,
                        transform 0.2s ease,
                        opacity 0.2s ease;
                }

                .create-account-button:hover:not(:disabled) {
                    background: #ff8120;
                    transform: translateY(-1px);
                }

                .create-account-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .bottom-login {
                    margin: 24px 0 0;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.58);
                    font-size: 11px;
                }

                .bottom-login button {
                    padding: 0;
                    border: 0;
                    background: transparent;
                    color: #ffffff;
                    text-decoration: underline;
                    font: inherit;
                    cursor: pointer;
                }

                /* ------------------------------
                   TABLET
                ------------------------------ */

                @media (max-width: 900px) {
                    .admin-register-page {
                        padding: 22px;
                    }

                    .admin-register-shell {
                        grid-template-columns: minmax(0, 1fr) minmax(340px, 0.9fr);
                    }

                    .admin-register-visual {
                        margin: 28px 0 28px 28px;
                        min-height: 580px;
                    }

                    .admin-register-form-panel {
                        padding: 40px 34px;
                    }

                    .visual-copy {
                        left: 25px;
                        right: 20px;
                        bottom: 26px;
                    }

                    .visual-copy h2 {
                        font-size: 34px;
                    }
                }

                /* ------------------------------
                   MOBILE
                ------------------------------ */

                @media (max-width: 720px) {
                    .admin-register-page {
                        min-height: 100vh;
                        padding: 14px;
                        align-items: flex-start;
                    }

                    .admin-register-shell {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        min-height: 0;
                        background: #1d1d1b;
                    }

                    .admin-register-visual {
                        min-height: 430px;
                        margin: 14px 14px 0;
                        border-radius: 15px;
                    }

                    .visual-logo {
                        width: 50px;
                        height: 40px;
                        top: 16px;
                        right: 17px;
                    }

                    .visual-back-button {
                        top: 16px;
                        left: 16px;
                    }

                    .visual-copy {
                        left: 24px;
                        right: 24px;
                        bottom: 24px;
                    }

                    .visual-copy h2 {
                        font-size: 34px;
                        letter-spacing: -1px;
                    }

                    .visual-copy p {
                        max-width: 330px;
                        margin-top: 14px;
                        font-size: 12px;
                    }

                    .admin-register-form-panel {
                        padding: 38px 24px 34px;
                    }

                    .admin-register-form-content {
                        width: 100%;
                    }

                    .form-header {
                        margin-bottom: 26px;
                    }

                    .form-header h1 {
                        font-size: 32px;
                    }

                    .admin-register-form {
                        gap: 14px;
                    }
                }

                @media (max-width: 420px) {
                    .admin-register-page {
                        padding: 0;
                    }

                    .admin-register-shell {
                        width: 100%;
                    }

                    .admin-register-visual {
                        margin: 0;
                        min-height: 400px;
                        border-radius: 0 0 16px 16px;
                    }

                    .admin-register-form-panel {
                        padding: 32px 18px 28px;
                    }

                    .visual-copy h2 {
                        font-size: 31px;
                    }

                    .field-group > input,
                    .password-field input,
                    .create-account-button {
                        height: 45px;
                    }
                }
            `}</style>
        </main>
    );
};

export default AdminRegister;
