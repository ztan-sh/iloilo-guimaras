import React, { useEffect, useState } from "react";
import { useAdminWorkspace } from "./AdminState";
import { AdminNotice } from "../../components/admin/AdminUI";
import { ActivityLogList } from "../../components/operations/ActivityLogList";

export default function AdminActivityLogs() {
    const { api, preview } = useAdminWorkspace();
    const [role, setRole] = useState("staff");
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(!preview);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (preview) return;
        let active = true;
        setLoading(true);
        api.get("/admin/audit-logs", { params: { actorRole: role, limit: 500 } })
            .then(({ data }) => { if (active) { setLogs(data.logs || []); setError(""); } })
            .catch(err => { if (active) setError(err.response?.data?.message || (err.response ? `Activity request failed (HTTP ${err.response.status}).` : `Unable to reach the server: ${err.message}`)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [api, role, preview, attempt]);
    return <section className="staff-panel operations-audit-panel">
        <div className="staff-section-heading"><div><h2>{role === "staff" ? "Staff activity" : "Administrator activity"}</h2><p>Recorded sign-ins and account actions, with timestamps in Philippine time.</p></div>
            <div className="operations-audit-tabs" aria-label="Activity category">
                <button type="button" aria-pressed={role === "staff"} className={role === "staff" ? "is-selected" : ""} onClick={() => setRole("staff")}>Staff activity</button>
                <button type="button" aria-pressed={role === "admin"} className={role === "admin" ? "is-selected" : ""} onClick={() => setRole("admin")}>Admin activity</button>
            </div>
        </div>
        {preview ? <AdminNotice>Activity records appear here in the connected admin workspace.</AdminNotice> : error ? <><AdminNotice error>{error}</AdminNotice><button className="staff-button staff-button-secondary" type="button" onClick={() => { setLoading(true); setError(""); setAttempt(value => value + 1); }}>Retry loading activity</button></> : loading ? <p role="status">Loading activity records…</p> : <ActivityLogList logs={logs} showActor empty={`No ${role === "staff" ? "staff" : "admin"} activity has been recorded yet.`} />}
    </section>;
}
