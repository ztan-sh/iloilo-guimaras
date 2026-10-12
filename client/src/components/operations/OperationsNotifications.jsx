import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StaffButton, StaffNotice, StaffStatus } from "../staff/StaffUI";
import { OperationsPanel } from "./OperationsUI";
import { operationsStore } from "./operationsStore";
import { useOperations } from "./useOperations";
import { formatTimestamp } from "../../pages/Staff/staffUtils";
export default function OperationsNotifications({ role, preview, basePath, bookings = [] }) {
    const ops = useOperations(preview);
    const navigate = useNavigate();
    const [liveRead, setLiveRead] = useState([]);
    const events = preview ? ops.events.filter(item => item.roles.includes(role)) : bookings.filter(item => item.createdAt || item.paidAt).map(item => ({ id: item._id, type: "booking", title: "Booking record updated", detail: `${item.passengerName} · ${item.bookingReference} · ${item.paymentStatus || "Payment not recorded"}`, time: item.paidAt || item.createdAt, bookingId: item._id })).sort((a, b) => new Date(b.time) - new Date(a.time));
    const read = preview ? ops.read[role] : liveRead;
    const open = item => navigate(`${basePath}/${item.type === "pricing" ? role === "admin" ? `pricing?vessel=${encodeURIComponent(item.vessel)}` : "assisted" : item.type === "discount" ? `discounts${item.requestId ? `?request=${encodeURIComponent(item.requestId)}` : ""}` : `bookings?booking=${encodeURIComponent(role === "admin" ? item.adminBookingId || item.bookingId : item.bookingId)}`}`);
    return <>
        <StaffNotice><div className="operations-summary-line"><div><strong>{role === "admin" ? "Booking and ID-review updates" : "Booking and review updates"}</strong><p>{role === "admin" ? "New bookings, staff ID decisions and vessel pricing updates appear here." : "Open booking updates and passenger IDs that need attention."}</p></div>{events.some(item => !read.includes(item.id)) && <StaffStatus warning>New update</StaffStatus>}</div></StaffNotice>
        {!preview && <StaffNotice>These updates come from available booking timestamps. Live notifications and ID-review updates need their own service.</StaffNotice>}
        <OperationsPanel><h2>Recent updates</h2>{events.length ? events.map(item => <div className="operations-record-row" key={item.id}><div><strong>{item.title}</strong><p>{item.detail}</p><small>{formatTimestamp(item.time, true)}</small></div>{!read.includes(item.id) && <StaffStatus warning>New</StaffStatus>}<StaffButton variant="secondary" onClick={() => open(item)}>Open record</StaffButton></div>) : <div className="operations-inset staff-empty"><p>No updates yet.</p></div>}</OperationsPanel>
        <OperationsPanel><h2>Open the related record</h2><div className="operations-related-actions"><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/bookings`)}>Booking passenger details</StaffButton><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/discounts`)}>{role === "admin" ? "ID-review records" : "Review discount IDs"}</StaffButton><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/${role === "admin" ? "pricing" : "assisted"}`)}>{role === "admin" ? "Vessel pricing" : "Assisted booking"}</StaffButton></div><p>ID decisions identify each passenger. New photo requests include the reason. ID approval never confirms payment.</p>{preview && <small>Preview notifications stay in this browser session. No message is sent to a customer.</small>}</OperationsPanel>
        <div className="operations-footer"><StaffButton variant="secondary" disabled={!events.some(item => !read.includes(item.id))} onClick={() => preview ? operationsStore.markRead(role) : setLiveRead(events.map(item => item.id))}>Mark all as read</StaffButton><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/overview`)}>Back to overview</StaffButton></div>
    </>;
}
