import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStaffFlow } from "./StaffPreview";
import { StaffBrand, StaffButton, StaffCapacity, StaffDialog, StaffIcon, StaffMetric, StaffNotice, StaffPanel, StaffStatus, useStaffMotion } from "../../components/staff/StaffUI";
import StaffScanner from "./StaffScanner";
import StaffWalkIn from "./StaffWalkIn";
import StaffAssisted from "./StaffAssisted";
import StaffDiscounts from "./StaffDiscounts";
import BookingDetails from "../../components/operations/BookingDetails";
import OperationsNotifications from "../../components/operations/OperationsNotifications";
import StaffActivity from "./StaffActivity";
import { useOperations } from "../../components/operations/useOperations";
import { formatTime, formatTimestamp, formatTripDate, hasMotorcycle, matchesTrip, passengerCount, sourceLabel, todayInManila } from "./staffUtils";
import "./Staff.css";
import "../../components/operations/Operations.css";

const navigation = [
    { path: "overview", label: "Terminal overview", icon: "home" },
    { path: "scanner", label: "Verify ticket", icon: "ticket" },
    { path: "discounts", label: "Discount approvals", icon: "card" },
    { path: "assisted", label: "Assisted booking", icon: "card" },
    { path: "manifest", label: "Boarding manifest", icon: "user" },
    { path: "bookings", label: "Booking details", icon: "user" },
    { path: "notifications", label: "Notifications", icon: "bell" },
    { path: "activity", label: "Activity logs", icon: "check" }
];
const headings = {
    overview: { title: "Terminal overview", subtitle: "Verify paid tickets and keep an eye on capacity before boarding." },
    scanner: { title: "Verify a ticket", subtitle: "Scan a QR ticket or look it up by ticket ID before boarding." },
    "walk-in": { title: "Walk-in ticketing", subtitle: "Record a paid terminal ticket within the walk-in motorcycle allocation." },
    manifest: { title: "Boarding manifest", subtitle: "Review paid passengers and motorcycles for the selected departure." },
    assisted: { title: "Assisted ticket booking", subtitle: "Follow the client flow: review each passenger’s ID, then confirm payment." },
    discounts: { title: "Discount approvals", subtitle: "Review passenger IDs before Student, PWD or Senior discounts apply." },
    bookings: { title: "Booking passenger details", subtitle: "Check the ride, passengers, individual IDs and confirmed payment." },
    notifications: { title: "Notifications", subtitle: "Open booking updates and ID requests that need attention." },
    activity: { title: "Activity logs", subtitle: "Review the sign-ins and ticket actions recorded for your account." }
};

export default function StaffWorkspace() {
    const { api, basePath, preview } = useStaffFlow();
    const ops = useOperations(preview);
    const unread = ops.events.some(item => item.roles.includes("staff") && !ops.read.staff.includes(item.id));
    const navigate = useNavigate();
    const location = useLocation();
    const root = useRef(null);
    const active = location.pathname.slice(basePath.length + 1).split("/")[0];
    const [date, setDate] = useState(todayInManila);
    const [data, setData] = useState(null);
    const [selectedId, setSelectedId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [tripPicker, setTripPicker] = useState(false);
    const [logoutDialog, setLogoutDialog] = useState(false);
    const [scannerHeading, setScannerHeading] = useState(headings.scanner);
    const [discountHeading, setDiscountHeading] = useState(headings.discounts);
    const loadRequest = useRef(null);
    const token = preview || localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken");
    let staff;
    try { staff = preview ? { name: "Terminal staff" } : JSON.parse(localStorage.getItem("staff") || "{}"); } catch { staff = {}; }

    const refresh = useCallback(async () => {
        loadRequest.current?.abort();
        const controller = new AbortController();
        loadRequest.current = controller;
        try {
            const response = await api.get("/staff/workspace", { params: { date }, signal: controller.signal });
            if (controller.signal.aborted) return;
            setData(response.data); setError("");
            setSelectedId(current => {
                if (response.data.trips.some(trip => trip.id === current)) return current;
                return response.data.trips.find(trip => new Date(`${trip.date}T${trip.departureTime}:00+08:00`) > new Date())?.id || response.data.trips[0]?.id || "";
            });
        } catch (err) {
            if (!controller.signal.aborted) setError(err.response?.data?.message || "Unable to load terminal data. Check your connection and retry.");
        } finally { if (!controller.signal.aborted) setLoading(false); }
    }, [date, api]);

    useEffect(() => {
        if (!token) return;
        setLoading(true); setData(null);
        void refresh();
        const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
        const reconnect = () => void refresh();
        window.addEventListener("online", reconnect);
        return () => { clearInterval(timer); window.removeEventListener("online", reconnect); loadRequest.current?.abort(); };
    }, [refresh, token]);

    useEffect(() => { if (preview && ops.bookingVersion) void refresh(); }, [ops.bookingVersion, preview, refresh]);
    const trip = data?.trips.find(item => item.id === selectedId);
    const records = trip ? data.bookings.filter(booking => matchesTrip(booking, trip)) : [];
    const paidRecords = records.filter(booking => booking.paymentStatus === "VERIFIED" && booking.status === "CONFIRMED" && booking.boardingStatus !== "REJECTED");
    const heading = active === "scanner" ? scannerHeading : active === "discounts" ? discountHeading : headings[active] || headings.overview;
    useStaffMotion(root, `${active}-${selectedId}-${heading.title}-${loading}`);
    if (!token) return <Navigate to={`${basePath}/login`} replace />;
    if (!headings[active]) return <Navigate to={`${basePath}/overview`} replace />;

    const logout = () => {
        if (!preview) {
            localStorage.removeItem("staffToken"); sessionStorage.removeItem("staffToken");
            localStorage.removeItem("staff"); sessionStorage.removeItem("staff");
        }
        navigate(`${basePath}/login`, { replace: true });
    };

    return <div className="staff-root staff-workspace" ref={root}>
        <a href="#staff-main" className="staff-skip-link">Skip to workspace</a>
        <aside className="staff-sidebar">
            <StaffBrand manifest={active === "manifest"} />
            <div className="staff-workspace-label"><span className="staff-eyebrow">Terminal workspace</span><p>Iloilo–Guimaras</p></div>
            <hr />
            <nav aria-label="Staff navigation">{navigation.map(item => <NavLink key={item.path} to={`${basePath}/${item.path}`} className={({ isActive }) => `staff-nav-item ${isActive || active === "walk-in" && item.path === "assisted" ? "is-active" : ""}`}><StaffIcon name={item.icon} /><span>{item.label}{item.path === "notifications" && unread && <small className="operations-unread"> · New</small>}</span></NavLink>)}</nav>
            <div className="staff-sidebar-bottom">
                <div className="staff-terminal-info"><strong>{trip?.route.startsWith("Guimaras") ? "Guimaras" : "Iloilo"} terminal</strong><span>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00+08:00`))}</span><span className={`staff-connection ${error ? "has-error" : ""}`}><StaffIcon name="connected" />{loading ? "Connecting…" : error ? "Connection interrupted" : preview ? "Preview data" : "Connected"}</span></div>
                <div className="staff-account"><StaffIcon name="account" /><div><strong>{staff.name || "Terminal staff"}</strong><small>Boarding &amp; ticketing</small></div></div>
                <StaffButton variant="secondary" onClick={() => setLogoutDialog(true)}>Log out</StaffButton>
            </div>
        </aside>
        <main id="staff-main" className="staff-main" tabIndex={-1}>
            <header className="staff-page-header"><div><span className="staff-eyebrow">Terminal operations</span><h1>{heading.title}</h1><p>{heading.subtitle}</p></div><button className="staff-header-date" onClick={() => setTripPicker(true)} aria-label="Choose trip date"><strong>{formatTripDate(date)}</strong><span>Iloilo ⇄ Guimaras</span></button></header>
            <StaffNotice error>{error}</StaffNotice>
            {error && <StaffButton variant="secondary" className="staff-retry" onClick={refresh}>Retry connection</StaffButton>}
            {trip && !["discounts", "bookings", "notifications", "activity"].includes(active) && <div className="staff-trip-tray"><div className="staff-trip"><div className="staff-trip-route"><h2>{trip.route}</h2><p>{trip.vesselName} · {formatTripDate(trip.date, true)}</p></div><div className="staff-trip-time"><span>Departure</span><strong>{formatTime(trip.departureTime)}</strong></div><div className="staff-trip-time"><span>Arrival</span><strong>{formatTime(trip.arrivalTime)}</strong></div><StaffButton variant="secondary" onClick={() => setTripPicker(true)}>View trip</StaffButton></div></div>}
            {loading ? <div className="staff-loading" role="status">Loading terminal trips…</div> : active === "activity" ? <StaffActivity /> : active === "discounts" ? <StaffDiscounts preview={preview} trip={trip} onHeading={setDiscountHeading} /> : active === "bookings" ? <BookingDetails role="staff" preview={preview} basePath={basePath} bookings={data?.bookings || []} trip={trip} api={api} onRefresh={refresh} /> : active === "notifications" ? <OperationsNotifications role="staff" preview={preview} basePath={basePath} bookings={data?.bookings || []} /> : !trip ? <StaffPanel><h2>No trips for this date</h2><p>{error ? "Retry the connection to load your terminal workspace." : "Scheduled departures will appear here once they have been added by an administrator."}</p><StaffButton variant="secondary" onClick={() => setTripPicker(true)}>Choose another date</StaffButton></StaffPanel> : <>
                {active === "overview" && <StaffOverview trip={trip} records={paidRecords} />}
                {active === "scanner" && <StaffScanner key={trip.id} trip={trip} onRefresh={refresh} onHeading={setScannerHeading} />}
                {active === "walk-in" && <StaffWalkIn key={trip.id} trip={trip} fares={data.fares} onRefresh={refresh} />}
                {active === "assisted" && <StaffAssisted key={trip.id} trip={trip} trips={data.trips} onSelectTrip={setSelectedId} onRefresh={refresh} />}
                {active === "manifest" && <StaffManifest trip={trip} records={paidRecords} />}
            </>}
        </main>
        {tripPicker && <StaffDialog title="Select a departure" onClose={() => setTripPicker(false)}>
            <label className="staff-field">Trip date<input type="date" value={date} onChange={event => { if (event.target.value) { setDate(event.target.value); setSelectedId(""); } }} /></label>
            <div className="staff-trip-options">{data?.trips.map(item => <button key={item.id} className={`staff-trip-option ${item.id === selectedId ? "is-selected" : ""}`} onClick={() => { setSelectedId(item.id); setTripPicker(false); }}><span><strong>{item.route}</strong><small>{item.vesselName}</small></span><span>{formatTime(item.departureTime)}</span></button>)}</div>
            {!loading && !data?.trips.length && <p>No scheduled departures for this date.</p>}
            <StaffButton variant="secondary" onClick={() => setTripPicker(false)}>Close</StaffButton>
        </StaffDialog>}
        {logoutDialog && <StaffDialog title="Log out of your staff account?" onClose={() => setLogoutDialog(false)}><p>Your camera will stop and this staff session will end.</p><div className="staff-actions"><StaffButton variant="secondary" onClick={() => setLogoutDialog(false)}>Cancel</StaffButton><StaffButton onClick={logout}>Log out</StaffButton></div></StaffDialog>}
    </div>;
}

function TripMetrics({ trip, manifest = false }) {
    const s = trip.statistics;
    return <div className={`staff-metrics ${manifest ? "staff-metrics-three" : ""}`}>
        <StaffMetric label="Paid passengers" value={`${s.paidPassengers} / ${s.passengerCapacity}`} detail={`${s.onlinePassengers} online · ${s.walkInPassengers} walk-in`} />
        {manifest && <StaffMetric label="Motorcycles" value={`${s.motorcycles} / ${s.motorcycleCapacity}`} detail={`${s.onlineMotorcycles} online · ${s.walkInMotorcycles} walk-in`} />}
        <StaffMetric label="Passengers boarded" value={`${s.boardedPassengers} / ${s.paidPassengers}`} detail={`${Math.max(0, s.paidPassengers - s.boardedPassengers)} passengers awaiting`} />
        {!manifest && <><StaffMetric label="Motorcycles · online" value={`${s.onlineMotorcycles} / ${s.onlineMotorcycleCapacity}`} detail={`${Math.max(0, s.onlineMotorcycleCapacity - s.onlineMotorcycles)} online slots available`} /><StaffMetric label="Motorcycles · walk-in" value={`${s.walkInMotorcycles} / ${s.walkInMotorcycleCapacity}`} detail={s.walkInMotorcycleCapacity ? `${Math.max(0, s.walkInMotorcycleCapacity - s.walkInMotorcycles)} walk-in slots available` : "No reserved walk-in allocation"} /></>}
    </div>;
}

function StaffOverview({ trip, records }) {
    const { basePath } = useStaffFlow();
    const navigate = useNavigate();
    const s = trip.statistics;
    const activity = records.filter(b => b.boardingStatus === "ON BOARD").sort((a, b) => new Date(b.boardedAt) - new Date(a.boardedAt)).slice(0, 3);
    return <>
        <TripMetrics trip={trip} />
        <div className="staff-two-panels staff-overview-panels">
            <StaffPanel><h2 className="staff-title-large">Ready for boarding</h2><p>Start by scanning a ticket. Confirm payment and the correct trip before recording boarding.</p><div className="staff-actions"><StaffButton onClick={() => navigate(`${basePath}/scanner`)}>Verify ticket</StaffButton><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/assisted`)}>Assisted booking</StaffButton></div><hr /><div><h2>Boarding activity</h2><p>Previously verified tickets</p></div><div className="staff-table-scroll"><table className="staff-table"><thead><tr><th>Passenger / ticket</th><th>Source</th><th>Boarding</th></tr></thead><tbody>{activity.map(b => <tr key={b._id}><td><strong>{b.passengerName}</strong><small>{b.bookingReference} · {formatTimestamp(b.boardedAt)}</small></td><td>{sourceLabel(b)}</td><td><StaffStatus>{b.timedOutAt ? "Arrived" : "Boarded"}</StaffStatus></td></tr>)}</tbody></table>{!activity.length && <p className="staff-empty">No boarding recorded yet for this trip.</p>}</div></StaffPanel>
            <StaffPanel><h2>Trip capacity</h2><StaffCapacity label="Passengers" used={s.paidPassengers} total={s.passengerCapacity} /><StaffCapacity label="Motorcycles" used={s.motorcycles} total={s.motorcycleCapacity} /><p>Online and walk-in motorcycle quotas are counted separately within the configured trip capacity.</p><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/manifest`)}>Open manifest</StaffButton></StaffPanel>
        </div>
    </>;
}

function StaffManifest({ trip, records }) {
    const { basePath } = useStaffFlow();
    const navigate = useNavigate();
    return <>
        <TripMetrics trip={trip} manifest />
        <StaffPanel className="staff-manifest-panel"><div className="staff-section-heading"><div><h2>Paid passenger manifest</h2><p>Both online and walk-in ticket holders</p></div><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/scanner`)}>Verify a ticket</StaffButton></div><div className="staff-table-scroll"><table className="staff-table staff-manifest-table"><thead><tr><th>Passenger / ticket</th><th>Source</th><th>Motorcycle</th><th>Payment</th><th>Boarding</th><th>Time</th></tr></thead><tbody>{records.map(b => <tr key={b._id}><td><button type="button" className="operations-text-link" onClick={() => navigate(`${basePath}/bookings?booking=${encodeURIComponent(b._id)}`)}>{b.passengerName}</button><small>{b.bookingReference}{b.accompanyingPassengers?.length ? ` · With ${b.accompanyingPassengers.join(", ")}` : b.passengerDetails?.length > 1 ? ` · With ${b.passengerDetails.slice(1).map(p => p.name).join(", ")}` : ""}</small></td><td>{sourceLabel(b)}</td><td><strong>{hasMotorcycle(b) ? b.motorcycleModel || "Motorcycle" : "—"}</strong><small>{hasMotorcycle(b) ? b.plateNumber : "Passenger only"}</small></td><td><StaffStatus>Paid</StaffStatus></td><td>{b.boardingStatus === "ON BOARD" ? <StaffStatus>{b.timedOutAt ? "Arrived" : "Boarded"}</StaffStatus> : <><strong>Awaiting</strong><small>{passengerCount(b)} {passengerCount(b) === 1 ? "passenger" : "passengers"}</small></>}</td><td><strong>{formatTimestamp(b.timedOutAt || b.boardedAt)}</strong><small>{b.timedOutAt ? "Arrival confirmed" : b.boardedAt ? "Boarding recorded" : "Not yet boarded"}</small></td></tr>)}</tbody></table>{!records.length && <p className="staff-empty">No paid tickets for this departure yet.</p>}</div><small>Showing {records.length} ticket records. Passenger and motorcycle counts include all paid tickets for this trip.</small></StaffPanel>
    </>;
}
