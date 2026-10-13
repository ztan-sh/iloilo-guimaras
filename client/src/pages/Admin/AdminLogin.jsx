import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminFlow } from "./AdminPreview";
import { AdminBrand, AdminButton, AdminField, AdminIcon, AdminNotice, useAdminMotion } from "../../components/admin/AdminUI";
import "../Staff/Staff.css";
import "./AdminDesktop.css";

export default function AdminLogin() {
    const { api, basePath, preview } = useAdminFlow();
    const navigate = useNavigate();
    const root = useRef(null);
    const [email, setEmail] = useState(preview ? "admin@guimarasgo.example" : "");
    const [password, setPassword] = useState(preview ? "design-preview" : "");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useAdminMotion(root, "login");

    const handleSubmit = async event => {
        event.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            if (preview) { navigate(`${basePath}/overview`, { replace: true }); return; }
            const { data } = await api.post("/admin/login", { email: email.trim(), password });
            if (!data.token) throw new Error("The sign-in response did not include a session. Please retry.");
            sessionStorage.removeItem("adminToken");
            sessionStorage.removeItem("adminData");
            localStorage.setItem("adminToken", data.token);
            if (data.admin) localStorage.setItem("adminData", JSON.stringify(data.admin));
            navigate(`${basePath}/overview`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to sign in. Check your connection and try again.");
        } finally { setLoading(false); }
    };

    return <main className="staff-root staff-sign-in admin-desktop" ref={root}>
        <section className="staff-introduction">
            <Link className="staff-home-link" to={preview ? `${basePath}/login` : "/"} aria-label="GuimarasGo home"><AdminBrand large /></Link>
            <div className="staff-intro-copy">
                <h1>A clearer view of<br />every crossing.</h1>
                <p>Manage schedules, paid tickets and capacity across the Iloilo–Guimaras route.</p>
                <div className="staff-route-illustration">
                    <div className="staff-route-terminals"><div><span>DEPARTURE</span><strong>Iloilo</strong></div><div><span>DESTINATION</span><strong>Guimaras</strong></div></div>
                    <div className="staff-route-art"><img src="/images/admin/3447e.svg" alt="Ferry route between Iloilo and Guimaras" /></div>
                    <small>Passengers &amp; motorcycles only</small>
                </div>
            </div>
            <p className="staff-intro-footer">Iloilo–Guimaras terminal operations</p>
        </section>
        <section className="staff-sign-in-form" aria-labelledby="admin-welcome">
            <form onSubmit={handleSubmit}>
                <span className="staff-eyebrow staff-eyebrow-accent">Admin access</span>
                <h2 id="admin-welcome">Welcome back</h2>
                <p>Sign in to your management workspace.</p>
                <AdminNotice error>{error}</AdminNotice>
                <AdminField label="Email address" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@guimarasgo.com" autoComplete="username" required disabled={loading} />
                <AdminField label="Password" icon="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required disabled={loading}>
                    <button type="button" className="staff-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><AdminIcon name="eye" /></button>
                </AdminField>
                <AdminButton type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in as Admin"}</AdminButton>
                <small>{preview ? "Sample account. Sign in to explore the design." : "Use your assigned administrator account."}</small>
            </form>
        </section>
    </main>;
}
