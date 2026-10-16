import React from "react";

export function ActivityLogList({ logs = [], showActor = false, empty = "No activity has been recorded yet." }) {
    const formatDate = value => value ? new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "medium"
    }).format(new Date(value)) : "—";
    return <div className="operations-audit-scroll">
        <table className="staff-table operations-audit-table">
            <thead><tr>{showActor && <th>Account</th>}<th>Activity</th><th>Details</th><th>Date and time (PHT)</th>{showActor && <th>IP address</th>}</tr></thead>
            <tbody>{logs.map(log => <tr key={log._id}>
                {showActor && <td><strong>{log.actorName}</strong><small>{log.actorEmail || log.actorRole}</small></td>}
                <td><strong>{log.action}</strong><small>{log.entityType}</small></td>
                <td>{log.summary}{log.subject && log.subject !== log.summary && <small>{log.subject}</small>}{log.details?.route && <small>{log.details.route} · {log.details.vesselName || "Ferry"} · {log.details.date || ""} {log.details.departureTime || ""}</small>}{log.details?.reason && <small>Reason: {log.details.reason}</small>}</td>
                <td><time dateTime={log.createdAt} title={log.userAgent || undefined}>{formatDate(log.createdAt)}</time></td>
                {showActor && <td>{log.ipAddress || "—"}<small title={log.userAgent || undefined}>{log.userAgent || "Device details unavailable"}</small></td>}
            </tr>)}</tbody>
        </table>
        {!logs.length && <p className="staff-empty">{empty}</p>}
    </div>;
}
