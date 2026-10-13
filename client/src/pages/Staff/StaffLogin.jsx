import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStaffFlow } from "./StaffPreview";
import { StaffBrand, StaffButton, StaffField, StaffIcon, StaffNotice, useStaffMotion } from "../../components/staff/StaffUI";
import "./Staff.css";

export default function StaffLogin() {
    const { api, basePath, preview } = useStaffFlow();
    const navigate = useNavigate();
    const root = useRef(null);
    const [email, setEmail] = useState(preview ? "staff@guimarasgo.example" : "");
    const [password, setPassword] = useState(preview ? "design-preview" : "");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useStaffMotion(root, "login");

    const handleSubmit = async event => {
        event.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            if (preview) { navigate(`${basePath}/overview`, { replace: true }); return; }
            const { data } = await api.post("/staff-auth/login", { email: email.trim(), password });
            if (!data.token) throw new Error("The sign-in response did not include a session. Please retry.");
            localStorage.removeItem("staffToken");
            sessionStorage.setItem("staffToken", data.token);
            if (data.staff) localStorage.setItem("staff", JSON.stringify(data.staff));
            navigate(`${basePath}/overview`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to sign in. Check your connection and try again.");
        } finally { setLoading(false); }
    };

    return <main className="staff-root staff-sign-in" ref={root}>
        <section className="staff-introduction">
            <Link className="staff-home-link" to={preview ? `${basePath}/login` : "/"} aria-label="GuimarasGo home"><StaffBrand large /></Link>
            <div className="staff-intro-copy">
                <h1>A smoother start<br />to every boarding.</h1>
                <p>Verify paid tickets, assist walk-in passengers and keep boarding organized.</p>
                <div className="staff-route-illustration">
                    <div className="staff-route-terminals"><div><span>DEPARTURE</span><strong>Iloilo</strong></div><div><span>DESTINATION</span><strong>Guimaras</strong></div></div>
                    <div className="staff-route-art"><img src="/images/staff/3447e.svg" alt="Ferry route between Iloilo and Guimaras" /></div>
                    <small>Passengers &amp; motorcycles only</small>
                </div>
            </div>
            <p className="staff-intro-footer">Iloilo–Guimaras terminal operations</p>
        </section>
        <section className="staff-sign-in-form" aria-labelledby="staff-welcome">
            <form onSubmit={handleSubmit}>
                <span className="staff-eyebrow staff-eyebrow-accent">Staff access</span>
                <h2 id="staff-welcome">Welcome back</h2>
                <p>Sign in to your terminal workspace.</p>
                <StaffNotice error>{error}</StaffNotice>
                <StaffField label="Email address" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@guimarasgo.com" autoComplete="username" required disabled={loading} />
                <StaffField label="Password" icon="lock" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required disabled={loading}>
                    <button type="button" className="staff-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><StaffIcon name="eye" /></button>
                </StaffField>
                <StaffButton type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in as Staff"}</StaffButton>
                <small>{preview ? "Sample account. Sign in to explore the design." : "Use your assigned staff account."}</small>
            </form>
        </section>
    </main>;
}
