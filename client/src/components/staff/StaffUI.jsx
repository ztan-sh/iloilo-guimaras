import React, { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@fontsource-variable/geist";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const icons = {
    home: "b67d3.svg", ticket: "0d048.svg", card: "49f6d.svg", user: "be76c.svg",
    account: "4b05a.svg", connected: "7bcce.svg", check: "82bff.svg",
    valid: "2ead2.svg", success: "8a9ee.svg", mail: "1b8de.svg", lock: "5e0ab.svg",
    eye: "b53dd.svg", ticketInput: "f79e9.svg"
};

export function StaffIcon({ name, className = "" }) {
    return <img className={`staff-icon ${className}`} src={name === "bell" ? "/images/operations/866ad.svg" : `/images/staff/${icons[name]}`} alt="" aria-hidden="true" />;
}

export function StaffBrand({ large = false, manifest = false }) {
    return <div className={`staff-brand ${large ? "staff-brand-large" : ""}`}>
        <span className="staff-brand-mark"><img src={`/images/staff/${large ? "59882.svg" : manifest ? "2fc1a.svg" : "69640.svg"}`} alt="" /></span>
        <span>GuimarasGo</span>
    </div>;
}

export function StaffButton({ children, variant = "primary", className = "", type = "button", ...props }) {
    return <button type={type} className={`staff-button staff-button-${variant} ${className}`} {...props}>{children}</button>;
}

export function StaffPanel({ children, className = "", ...props }) {
    return <section className={`staff-panel-tray ${className}`} {...props}><div className="staff-panel">{children}</div></section>;
}

export function StaffField({ label, icon, children, id: suppliedId, ...props }) {
    const generatedId = useId();
    const id = suppliedId || generatedId;
    return <div className="staff-field">
        <label htmlFor={id}>{label}</label>
        <div className="staff-input-wrap">
            {icon && <span className="staff-input-icon"><StaffIcon name={icon} /></span>}
            <input id={id} {...props} />{children}
        </div>
    </div>;
}

export function StaffStatus({ children, warning = false }) {
    return <span className={`staff-status ${warning ? "staff-status-warning" : ""}`}>{children}</span>;
}

export function StaffMetric({ label, value, detail }) {
    return <div className="staff-metric"><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>;
}

export function StaffCapacity({ label, used, total }) {
    const percentage = total > 0 ? Math.min(100, Math.max(0, used / total * 100)) : 0;
    return <div className="staff-capacity">
        <div><span>{label}</span><strong>{used} / {total}</strong></div>
        <div className="staff-capacity-track" role="progressbar" aria-label={label} aria-valuenow={used} aria-valuemin={0} aria-valuemax={Math.max(total, used)}>
            <span style={{ width: `${percentage}%` }} />
        </div>
    </div>;
}

export function StaffDetail({ label, children }) {
    return <div className="staff-detail"><span>{label}</span><p>{children || "—"}</p></div>;
}

export function StaffNotice({ children, error = false }) {
    return children ? <div className={`staff-notice ${error ? "staff-notice-error" : ""}`} role={error ? "alert" : "status"}>{children}</div> : null;
}

export function StaffDialog({ title, children, onClose }) {
    const ref = useRef(null);
    const id = useId();
    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);
    return <dialog ref={ref} className="staff-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }}>
        <div className="staff-dialog-heading"><h2 id={id}>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>
        {children}
    </dialog>;
}

export function useStaffMotion(ref, key) {
    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        gsap.from(".staff-page-header, .staff-trip-tray, .staff-metrics, .staff-panel-tray, .operations-panel", {
            opacity: 0, y: 8, duration: 0.3, stagger: 0.035, ease: "power2.out", clearProps: "all"
        });
        const media = gsap.matchMedia();
        media.add("(max-width: 760px)", () => {
            gsap.utils.toArray(".staff-panel-tray, .operations-panel").forEach(panel => {
                gsap.fromTo(panel, { y: 6 }, { y: 0, duration: 0.25, clearProps: "transform", scrollTrigger: { trigger: panel, start: "top 95%", once: true } });
            });
        });
        return () => media.revert();
    }, { scope: ref, dependencies: [key], revertOnUpdate: true });
}
