import React, { useRef, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AdminState, useAdminWorkspace } from "./AdminState";
import { useAdminFlow } from "./AdminPreview";
import { AdminBrand, AdminButton, AdminDialog, AdminField, AdminIcon, AdminNotice, useAdminMotion } from "../../components/admin/AdminUI";
import { formatTime, formatTripDate, tripLabel, weekdayDate } from "./adminUtils";
import { AdminBoarding, AdminOverview, AdminPassengers, AdminPayments, AdminRecords, AdminSchedules, AdminTickets, AdminTripEditor } from "./AdminScreens";
import AdminPricing from "./AdminPricing";
import PaymentVerification from "./PaymentVerification";
import BookingDetails from "../../components/operations/BookingDetails";
import OperationsNotifications from "../../components/operations/OperationsNotifications";
import StaffDiscounts from "../Staff/StaffDiscounts";
import { matchesTrip } from "../Staff/staffUtils";
import { useOperations } from "../../components/operations/useOperations";
import "../Staff/Staff.css";
import "./AdminDesktop.css";
import "../../components/operations/Operations.css";

const destinations = [
    ["overview", "Overview", "home", "Operations overview", "Monitor paid tickets, capacity and boarding for the selected trip."],
    ["schedules", "Schedules", "schedules", "Ferry schedules", "Manage departure times and review paid capacity before each crossing."],
    ["pricing", "Ride pricing", "card", "Ride pricing", "Choose a vessel to edit its ride fares and passenger discounts."],
    ["tickets", "Ticket records", "ticket", "Ticket records", "Review paid online tickets and walk-in sales for the selected trip."],
    ["passengers", "Passengers", "user", "Passenger information", "View passenger details and motorcycle information linked to paid tickets."],
    ["payments", "Payments", "card", "Payment records", "Track successful payments and review processing or failed attempts."],
    ["boarding", "Boarding records", "check", "Boarding records", "Monitor validated tickets and boarded passengers for each departure."],
    ["records", "System records", "lock", "System records", "Review schedule updates, payment events and ticket verification activity."],
    ["bookings", "Booking details", "user", "Booking passenger details", "Check the ride, passengers, individual IDs and confirmed payment."],
    ["notifications", "Notifications", "bell", "Notifications", "Monitor new bookings, staff ID decisions and pricing updates."]
];

function AdminShell() {
    const state = useAdminWorkspace();
    const ops = useOperations(state.preview);
    const unread = ops.events.some(item => item.roles.includes("admin") && !ops.read.admin.includes(item.id));
    const { basePath, preview, schedules, selectedTrip, setSelectedId, date, setDate, loading, error, refresh, notice, setNotice, admin } = state;
    const location = useLocation();
    const navigate = useNavigate();
    const root = useRef(null);
    const [chooseTrip, setChooseTrip] = useState(false);
    const segment = location.pathname.slice(basePath.length + 1).split("/")[0];
    const editing = segment === "trips";
    const current = segment === "discounts" ? ["discounts", "ID-review records", "card", "ID-review records", "Inspect passenger ID submissions and staff review decisions."] : segment === "payment-verification" ? ["payment-verification", "Payment verification", "card", "Payment verification", "Review uploaded receipts and verify or reject pending payments."] : destinations.find(item => item[0] === segment) || destinations[0];
    useAdminMotion(root, `${location.pathname}-${loading}`);
    const logout = () => {
        if (!preview) for (const storage of [localStorage, sessionStorage]) { storage.removeItem("adminToken"); storage.removeItem("adminData"); }
        navigate(`${basePath}/login`, { replace: true });
    };
    return <div className="staff-root staff-workspace admin-desktop" ref={root}>
        <a className="staff-skip-link" href="#admin-content">Skip to content</a>
        <aside className="staff-sidebar">
            <AdminBrand />
            <div className="staff-workspace-label"><span className="staff-eyebrow">Admin workspace</span><p>Iloilo–Guimaras</p></div><hr />
            <nav aria-label="Admin navigation">{destinations.map(([path, label, icon]) => <NavLink key={path} to={`${basePath}/${path}`} className={({ isActive }) => `staff-nav-item ${isActive || editing && path === "schedules" ? "is-active" : ""}`}><AdminIcon name={icon} /><span>{label}{path === "notifications" && unread && <small className="operations-unread"> · New</small>}</span></NavLink>)}</nav>
            <div className="staff-sidebar-bottom">
                <div className="staff-terminal-info"><strong>{selectedTrip?.route.startsWith("Guimaras") ? "Guimaras" : "Iloilo"} terminal</strong><span>{weekdayDate(date)} {date.slice(0, 4)}</span><span className={`staff-connection ${error ? "has-error" : ""}`}><AdminIcon name="connected" />{error ? "Connection unavailable" : loading ? "Connecting…" : preview ? "Sample workspace" : "Connected"}</span></div>
                <div className="staff-account"><AdminIcon name="account" /><div><strong>{admin?.name || "Administrator"}</strong><small>Management access</small></div></div>
                <AdminButton variant="secondary" onClick={logout}>Log out</AdminButton>
            </div>
        </aside>
        <main id="admin-content" className="staff-main" tabIndex={-1}>
            <header className="staff-page-header"><div><span className="staff-eyebrow">Management</span><h1>{editing ? location.pathname.endsWith("/new") ? "Add a trip" : "Trip details" : current[3]}</h1><p>{editing ? "Set the route and departure time. Capacity follows the approved allocation." : current[4]}</p></div>
                <button className="staff-header-date" type="button" onClick={() => setChooseTrip(true)} aria-label="Change selected date or trip"><strong>{formatTripDate(date)}</strong><span>{selectedTrip?.route || "Select a departure"}</span></button>
            </header>
            {notice && <div className="admin-desktop-notice"><AdminNotice>{notice}</AdminNotice><button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
            {loading ? <div className="staff-loading" role="status">Loading management workspace…</div> : error ? <div className="staff-form-stack"><AdminNotice error>{error}</AdminNotice><AdminButton className="staff-retry" variant="secondary" onClick={refresh}>Retry connection</AdminButton></div> : <Routes>
                <Route path="overview" element={<AdminOverview />} /><Route path="schedules" element={<AdminSchedules />} />
                <Route path="trips/:tripId" element={<AdminTripEditor />} /><Route path="tickets" element={<AdminTickets />} />
                <Route path="passengers" element={<AdminPassengers />} /><Route path="payments" element={<AdminPayments />} />
                <Route path="boarding" element={<AdminBoarding />} /><Route path="records" element={<AdminRecords />} />
                <Route path="pricing" element={<AdminPricing />} /><Route path="payment-verification" element={<PaymentVerification />} />
                <Route path="bookings" element={<BookingDetails role="admin" preview={preview} basePath={basePath} bookings={state.bookings} trip={selectedTrip} onSelectRelatedTrip={booking => { const related = schedules.find(item => matchesTrip(booking, item)); if (related) setSelectedId(related.id); }} />} />
                <Route path="notifications" element={<OperationsNotifications role="admin" preview={preview} basePath={basePath} bookings={state.bookings} />} />
                <Route path="discounts" element={<StaffDiscounts preview={preview} trip={selectedTrip} readOnly />} />
                <Route path="*" element={<Navigate to={`${basePath}/overview`} replace />} />
            </Routes>}
            {!preview && <a className="admin-desktop-legacy" href="/admin-dashboard"></a>}
        </main>
        {chooseTrip && <AdminDialog title="Choose a departure" onClose={() => setChooseTrip(false)}>
            <AdminField label="Travel date" type="date" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} />
            {loading ? <p role="status">Loading departures…</p> : <div className="staff-trip-options">{schedules.map(trip => <button type="button" className={`staff-trip-option ${selectedTrip?.id === trip.id ? "is-selected" : ""}`} key={trip.id} onClick={() => { setSelectedId(trip.id); setChooseTrip(false); }}><span><strong>{trip.route}</strong><small>{trip.vesselName} · {tripLabel(trip)}</small></span><strong>{formatTime(trip.departureTime)}</strong></button>)}{!schedules.length && <p>No departures on this date. Add one in Schedules.</p>}</div>}
        </AdminDialog>}
    </div>;
}

export default function AdminWorkspace() {
    const { preview, basePath } = useAdminFlow();
    const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (!preview && !token) return <Navigate to={`${basePath}/login`} replace />;
    return <AdminState><AdminShell /></AdminState>;
}
