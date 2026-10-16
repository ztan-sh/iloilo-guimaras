import React, { useEffect, useState } from "react";
import { useStaffFlow } from "./StaffPreview";
import { StaffNotice, StaffPanel } from "../../components/staff/StaffUI";
import { ActivityLogList } from "../../components/operations/ActivityLogList";

export default function StaffActivity() {
    const { api, preview } = useStaffFlow();
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(!preview);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (preview) return;
        let active = true;
        setLoading(true);
        setError("");
        api.get("/staff-auth/activity")
            .then(({ data }) => { if (active) { setLogs(data.logs || []); setError(""); } })
            .catch(err => { if (active) setError(err.response?.data?.message || (err.response ? `Activity request failed (HTTP ${err.response.status}).` : `Unable to reach the server: ${err.message}`)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [api, preview, attempt]);
    return <StaffPanel className="operations-audit-panel">
        <div className="staff-section-heading"><div><h2>Your account activity</h2><p>Recent sign-ins, ticket lookups, boarding and ticketing actions.</p></div></div>
        {preview ? <StaffNotice>Activity records appear here when connected to the live staff workspace.</StaffNotice> : error ? <><StaffNotice error>{error}</StaffNotice><button className="staff-button staff-button-secondary" type="button" onClick={() => { setLoading(true); setError(""); setAttempt(value => value + 1); }}>Retry loading activity</button></> : loading ? <p role="status">Loading your activity…</p> : <ActivityLogList logs={logs} />}
    </StaffPanel>;
}
