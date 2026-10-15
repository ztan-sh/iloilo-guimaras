import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAdminWorkspace } from "./AdminState";
import { AdminButton, AdminCapacity, AdminCell, AdminDetail, AdminDialog, AdminField, AdminHeading, AdminMetric, AdminNotice, AdminPanel, AdminStatus, AdminTable } from "../../components/admin/AdminUI";
import { boardingState, formatTime, formatTimestamp, formatTripDate, hasMotorcycle, isPaid, matchesSearch, money, passengerCount, passengerNames, passengerRows, paymentAmount, paymentReference, paymentState, paymentTime, sourceLabel, tripLabel, tripState, tripStatistics, weekdayDate } from "./adminUtils";

const locations = ["Iloilo", "Guimaras"].map(value => ({ value, label: value }));
const columns = labels => labels.map(([label, width]) => ({ label, width }));
const countLabel = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

function TripBanner({ status = false }) {
    const { selectedTrip: trip, bookings, basePath } = useAdminWorkspace();
    const navigate = useNavigate();
    return trip ? <section className="staff-trip-tray" aria-label="Selected departure"><div className="staff-trip">
        <div className="staff-trip-route"><h2>{trip.route}</h2><p>{trip.vesselName} · Trip {tripLabel(trip)} · {formatTripDate(trip.date, true)}</p></div>
        <div className="staff-trip-time"><span>Departure</span><strong>{formatTime(trip.departureTime)}</strong></div>
        <div className="staff-trip-time"><span>Arrival</span><strong>{formatTime(trip.arrivalTime)}</strong></div>
        {status ? <div className="admin-desktop-trip-status"><AdminStatus>{tripState(trip, bookings)}</AdminStatus></div> : <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/trips/${trip.id}`)}>View trip</AdminButton>}
    </div></section> : <AdminNotice>No departures on this date. Add a trip in Schedules.</AdminNotice>;
}

function usePage(rows, size = 8) {
    const [page, setPage] = useState(0);
    const current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1));
    return { rows: rows.slice(current * size, (current + 1) * size), current, size, total: rows.length, setPage };
}
function Pagination({ page, children }) {
    const { current, size, total, setPage } = page;
    return <div className="admin-desktop-table-footer"><small>{children || (total ? `Showing ${current * size + 1}–${Math.min((current + 1) * size, total)} of ${total} records` : "No matching records")}</small>
        {total > size && <div className="admin-desktop-pagination"><button type="button" aria-label="Previous records" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button><button type="button" aria-label="Next records" disabled={(current + 1) * size >= total} onClick={() => setPage(current + 1)}>Next</button></div>}
    </div>;
}

export function AdminOverview() {
    const { schedules, selectedTrip: trip, statistics: s, bookings, setSelectedId, basePath, date } = useAdminWorkspace();
    const navigate = useNavigate();
    return <>
        <TripBanner />
        <div className="staff-metrics">
            <AdminMetric label="Paid passengers" value={`${s.paidPassengers} / ${trip?.passengerCapacity ?? "—"}`} detail={`${s.onlinePassengers} online · ${s.walkInPassengers} walk-in`} />
            <AdminMetric label="Motorcycle capacity" value={`${s.motorcycles} / ${trip?.motorcycleCapacity ?? "—"}`} detail={`${s.onlineMotorcycles} online · ${s.walkInMotorcycles} walk-in`} />
            <AdminMetric label="Passengers boarded" value={`${s.boardedPassengers} / ${s.paidPassengers}`} detail={`${s.paidPassengers - s.boardedPassengers} paid passengers remaining`} />
            <AdminMetric label="Selected trip revenue" value={money(s.revenue)} detail="Successful payments only" />
        </div>
        <div className="staff-two-panels admin-desktop-overview-panels">
            <AdminPanel>
                <AdminHeading title="Today's departures" detail={`${weekdayDate(date)} · Paid occupancy by trip`}><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/schedules`)}>Manage schedules</AdminButton></AdminHeading>
                <AdminTable label="Departure overview" columns={columns([["Trip & route", 42], ["Time", 18], ["Passengers", 20], ["Status", 20]])} empty={!schedules.length && "No departures for this date."}>
                    {schedules.slice(0, 3).map(item => <tr key={item.id} data-selected={item.id === trip?.id}>
                        <td><button className="admin-desktop-row-button" type="button" onClick={() => { setSelectedId(item.id); navigate(`${basePath}/boarding`); }}><strong>{tripLabel(item)} · {item.vesselName}</strong><small>{item.route}</small></button></td>
                        <AdminCell label={formatTime(item.departureTime)} detail={`${formatTime(item.arrivalTime)} arrival`} />
                        <AdminCell label={`${tripStatistics(bookings, item).paidPassengers} / ${item.passengerCapacity}`} />
                        <td><AdminStatus>{tripState(item, bookings)}</AdminStatus></td>
                    </tr>)}
                </AdminTable>
                <small>Select a trip to review its boarding records.</small>
            </AdminPanel>
            <AdminPanel>
                <h2>Capacity allocation</h2><p>Paid tickets · {tripLabel(trip)}</p>
                <AdminCapacity label="Passengers" used={s.paidPassengers} total={trip?.passengerCapacity ?? 0} />
                <AdminCapacity label="Motorcycles · online" used={s.onlineMotorcycles} total={trip?.onlineMotorcycleCapacity ?? 0} />
                <AdminCapacity label="Motorcycles · walk-in" used={s.walkInMotorcycles} total={trip?.walkInMotorcycleCapacity ?? 0} />
                <small>{Math.max(0, (trip?.onlineMotorcycleCapacity ?? 0) - s.onlineMotorcycles)} online and {Math.max(0, (trip?.walkInMotorcycleCapacity ?? 0) - s.walkInMotorcycles)} walk-in motorcycle slots remain in the paid allocation.</small>
            </AdminPanel>
        </div>
    </>;
}

export function AdminSchedules() {
    const { schedules, bookings, date, setDate, selectedTrip, setSelectedId, basePath, api, refresh, setNotice } = useAdminWorkspace();
    const navigate = useNavigate();
    const [route, setRoute] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [confirmTrip, setConfirmTrip] = useState(null);
    const rows = schedules.filter(trip => !route || trip.route === route);
    const trip = rows.find(item => item.id === selectedTrip?.id) || rows[0];
    const page = usePage(rows, 8);
    const deleteTrip = async () => {
        if (!confirmTrip || deleting) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await api.delete(`/bookings/schedules/${confirmTrip.id}`);
            setConfirmTrip(null);
            setSelectedId("");
            setNotice("Trip deleted and removed from passenger schedules.");
            refresh();
        } catch (error) {
            setDeleteError(error.response?.data?.message || error.message || "Unable to delete this trip.");
        } finally {
            setDeleting(false);
        }
    };
    return <>
        <div className="admin-desktop-schedule-filters">
            <AdminField label="Travel date" icon="routeInput" type="date" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} />
            <AdminField label="Route" icon="routeInput" value={route} onChange={e => setRoute(e.target.value)} options={[{ value: "", label: "All routes" }, ...["Iloilo → Guimaras", "Guimaras → Iloilo"].map(value => ({ value, label: value }))]} />
            <AdminButton onClick={() => navigate(`${basePath}/trips/new`)}><span aria-hidden="true">＋ </span>Add trip</AdminButton>
        </div>
        <AdminPanel>
            <AdminHeading title={weekdayDate(date)} detail={`${countLabel(rows.length, "trip")} · ${route || "both directions"}`} />
            <AdminNotice error>{deleteError}</AdminNotice>
            <AdminTable label="Ferry schedules" className="admin-desktop-wide-table" columns={columns([["Trip / vessel", 23], ["Route", 23], ["Departure", 13], ["Passengers", 13], ["Motorcycles", 13], ["Status", 15]])} empty={!rows.length && "No trips match this date and route."}>
                {page.rows.map(item => {
                    const s = tripStatistics(bookings, item);
                    return <tr key={item.id} data-selected={trip?.id === item.id} onClick={() => setSelectedId(item.id)}>
                        <td><button className="admin-desktop-row-button" type="button" aria-label={`Select trip ${tripLabel(item)}`} aria-pressed={trip?.id === item.id} onClick={() => setSelectedId(item.id)}><strong>{tripLabel(item)}</strong><small>{item.vesselName}</small></button></td>
                        <AdminCell label={item.route} detail={`Arrival ${formatTime(item.arrivalTime)}`} />
                        <AdminCell label={formatTime(item.departureTime)} />
                        <AdminCell label={`${s.paidPassengers} / ${item.passengerCapacity}`} />
                        <AdminCell label={`${s.motorcycles} / ${item.motorcycleCapacity}`} detail={`Online ${s.onlineMotorcycles} · Walk-in ${s.walkInMotorcycles}`} />
                        <td><AdminStatus>{tripState(item, bookings)}</AdminStatus></td>
                    </tr>;
                })}
            </AdminTable>
            <div className="admin-desktop-table-footer"><Pagination page={page}>{countLabel(rows.length, "trip")}</Pagination><div className="admin-desktop-table-actions"><AdminButton variant="danger" disabled={!trip || deleting} onClick={() => { setDeleteError(""); setConfirmTrip({ ...trip, relatedBookings: tripStatistics(bookings, trip).records.length }); }}>{deleting ? "Deleting…" : "Delete selected trip"}</AdminButton><AdminButton variant="secondary" disabled={!trip || deleting} onClick={() => navigate(`${basePath}/trips/${trip.id}`)}>Edit selected trip</AdminButton></div></div>
        </AdminPanel>
        {trip && <div className="staff-trip-tray"><p className="admin-desktop-allocation-note">This trip accommodates {trip.passengerCapacity} passengers and {trip.motorcycleCapacity} motorcycles. Motorcycle slots are allocated {trip.onlineMotorcycleCapacity} online and {trip.walkInMotorcycleCapacity} walk-in.</p></div>}
        {confirmTrip && <AdminDialog title="Delete this trip?" onClose={() => { if (!deleting) setConfirmTrip(null); }}>
            <div className="admin-delete-confirm">
                <p>This departure will be removed from passenger schedules.</p>
                <AdminNotice error>{deleteError}</AdminNotice>
                <dl><div><dt>Vessel</dt><dd>{confirmTrip.vesselName}</dd></div><div><dt>Route</dt><dd>{confirmTrip.route}</dd></div><div><dt>Departure</dt><dd>{formatTime(confirmTrip.departureTime)} · {formatTripDate(confirmTrip.date)}</dd></div></dl>
                {confirmTrip.relatedBookings > 0 && <p className="admin-delete-warning">There {confirmTrip.relatedBookings === 1 ? "is" : "are"} {confirmTrip.relatedBookings} existing booking record{confirmTrip.relatedBookings === 1 ? "" : "s"}. They will remain in the system, but staff will no longer see this trip for boarding.</p>}
                <div className="admin-delete-actions"><AdminButton variant="secondary" disabled={deleting} onClick={() => setConfirmTrip(null)}>Cancel</AdminButton><AdminButton variant="danger" disabled={deleting} onClick={deleteTrip}>{deleting ? "Deleting…" : "Delete trip"}</AdminButton></div>
            </div>
        </AdminDialog>}
    </>;
}

export function AdminTripEditor() {
    const { tripId } = useParams();
    const { schedules, selectedTrip, date, setDate, setSelectedId, refresh, setNotice, api, basePath } = useAdminWorkspace();
    const navigate = useNavigate();
    const isNew = tripId === "new";
    const existing = schedules.find(trip => trip.id === tripId);
    const defaults = existing || selectedTrip || { passengerCapacity: 100, motorcycleCapacity: 10, walkInMotorcycleCapacity: 0, onlineMotorcycleCapacity: 10 };
    const [form, setForm] = useState(() => ({ vesselName: existing?.vesselName || "", origin: existing?.route.split(" → ")[0] || "Iloilo", destination: existing?.route.split(" → ")[1] || "Guimaras",
        date: existing?.date || date, departureTime: existing?.departureTime || "", arrivalTime: existing?.arrivalTime || "" }));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const change = key => e => setForm(current => ({ ...current, [key]: e.target.value }));
    const save = async event => {
        event.preventDefault();
        if (saving) return;
        setError("");
        if (form.origin === form.destination) { setError("Origin and destination must be different terminals."); return; }
        if (form.arrivalTime <= form.departureTime) { setError("Arrival time must be later than departure time."); return; }
        setSaving(true);
        const body = { vesselName: form.vesselName.trim(), route: `${form.origin} → ${form.destination}`, date: form.date,
            departureTime: form.departureTime, arrivalTime: form.arrivalTime, passengerCapacity: defaults.passengerCapacity,
            motorcycleCapacity: defaults.motorcycleCapacity, walkInMotorcycleCapacity: defaults.walkInMotorcycleCapacity };
        try {
            const { data } = isNew ? await api.post("/bookings/schedules", body) : await api.put(`/bookings/schedules/${existing.id}`, body);
            setSelectedId(String(data.schedule?._id || data.schedule?.id || existing?.id || ""));
            setDate(form.date); refresh(); setNotice(isNew ? "New trip added." : "Trip details saved.");
            navigate(`${basePath}/schedules`);
        } catch (err) { setError(err.response?.data?.message || err.message || "Unable to save this trip."); }
        finally { setSaving(false); }
    };
    if (!isNew && !existing) return <AdminPanel><h2>Trip unavailable</h2><p>This trip does not belong to the selected date.</p><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/schedules`)}>Back to schedules</AdminButton></AdminPanel>;
    return <div className="staff-two-panels">
        <AdminPanel><form className="staff-form-stack" onSubmit={save}>
            <AdminHeading title="Schedule information" detail={isNew ? "New departure" : `Trip ${tripLabel(existing)}`} />
            <AdminNotice error>{error}</AdminNotice>
            <AdminField label="Vessel" icon="ticketInput" placeholder="Enter vessel name" value={form.vesselName} onChange={change("vesselName")} required disabled={saving} maxLength={100} />
            <div className="staff-details-grid"><AdminField label="Origin" icon="routeInput" options={locations} value={form.origin} onChange={change("origin")} disabled={saving} /><AdminField label="Destination" icon="routeInput" options={locations} value={form.destination} onChange={change("destination")} disabled={saving} /></div>
            <AdminField label="Travel date" icon="routeInput" type="date" value={form.date} onChange={change("date")} required disabled={saving} />
            <div className="staff-details-grid"><AdminField label="Departure" icon="routeInput" type="time" min="03:30" max="19:30" step="1800" value={form.departureTime} onChange={change("departureTime")} required disabled={saving} /><AdminField label="Arrival" icon="routeInput" type="time" min="04:00" max="20:00" step="1800" value={form.arrivalTime} onChange={change("arrivalTime")} required disabled={saving} /></div>
            <hr /><div className="admin-desktop-editor-actions"><AdminButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save trip"}</AdminButton><AdminButton variant="secondary" disabled={saving} onClick={() => navigate(`${basePath}/schedules`)}>Cancel</AdminButton></div>
        </form></AdminPanel>
        <AdminPanel><h2>Trip capacity</h2><small>{isNew ? "Follows the selected service configuration" : "Configured for this service"}</small>
            <AdminDetail label="Maximum passengers">{defaults.passengerCapacity} passengers</AdminDetail><hr /><AdminDetail label="Maximum motorcycles">{defaults.motorcycleCapacity} motorcycles</AdminDetail>
            <div className="admin-desktop-capacity-summary"><AdminDetail label="Online allocation">{defaults.onlineMotorcycleCapacity} motorcycles</AdminDetail><AdminDetail label="Walk-in allocation">{defaults.walkInMotorcycleCapacity} motorcycles</AdminDetail></div>
            <small>Passengers and motorcycles only.</small>
        </AdminPanel>
    </div>;
}

export function AdminTickets() {
    const { statistics: s, selectedTrip: trip, basePath } = useAdminWorkspace();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [id, setId] = useState("");
    const rows = s.paid.filter(b => matchesSearch(query, b.passengerName, b.bookingReference, ...passengerNames(b)));
    const page = usePage(rows, 6);
    const ticket = rows.find(b => b._id === id) || rows[0];
    return <><TripBanner /><div className="staff-two-panels">
        <AdminPanel><AdminHeading title="Paid tickets" detail={`Showing ${countLabel(rows.length, "ticket record")}`} />
            <AdminField label="Search tickets" icon="ticketInput" type="search" placeholder="Search ticket ID or passenger name" value={query} onChange={e => { setQuery(e.target.value); page.setPage(0); }} />
            <AdminTable label="Paid tickets" className="admin-desktop-ticket-table" columns={columns([["Passenger / ticket", 38], ["Source", 18], ["Travelers", 23], ["Payment", 21]])} empty={!rows.length && "No paid tickets match your search."}>
                {page.rows.map(b => <tr key={b._id} data-selected={b._id === ticket?._id} onClick={() => setId(b._id)}><td><button type="button" className="admin-desktop-row-button" aria-label={`View ticket ${b.bookingReference}`} aria-pressed={b._id === ticket?._id} onClick={() => setId(b._id)}><strong>{b.passengerName}</strong><small>{b.bookingReference}</small></button></td><AdminCell label={sourceLabel(b)} /><AdminCell label={countLabel(passengerCount(b), "passenger")} detail={hasMotorcycle(b) ? "1 motorcycle" : "No motorcycle"} /><td><AdminStatus>Paid</AdminStatus></td></tr>)}
            </AdminTable>{rows.length > 6 && <Pagination page={page} />}
        </AdminPanel>
        <AdminPanel>{ticket ? <>
            <div className="staff-section-heading"><h2>{ticket.bookingReference}</h2><AdminStatus>Paid</AdminStatus></div>
            <AdminDetail label="Ticket holder">{ticket.passengerName}</AdminDetail><AdminDetail label="Route & departure">{trip?.route} · {formatTime(trip?.departureTime)}</AdminDetail><hr />
            <AdminDetail label="Passengers">{passengerNames(ticket).join(" · ")}</AdminDetail><AdminDetail label="Motorcycle">{hasMotorcycle(ticket) ? [ticket.motorcycleModel || "Motorcycle", ticket.plateNumber].filter(Boolean).join(" · ") : "Passenger only"}</AdminDetail>
            <AdminDetail label="Payment">{money(paymentAmount(ticket))} · {ticket.paymentMethod}</AdminDetail><AdminDetail label="Boarding status">{boardingState(ticket) === "Ready" ? "Awaiting boarding" : boardingState(ticket)}</AdminDetail>
            <AdminButton variant="secondary" onClick={() => navigate(`${basePath}/bookings?booking=${encodeURIComponent(ticket._id)}`)}>View passenger details</AdminButton><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/payments?payment=${encodeURIComponent(ticket._id)}`)}>View payment</AdminButton>
        </> : <><h2>Ticket details</h2><p>Select a paid ticket to view its details.</p></>}</AdminPanel>
    </div></>;
}

export function AdminPassengers() {
    const { statistics: s, selectedTrip: trip, basePath } = useAdminWorkspace();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const rows = passengerRows(s.paid).filter(({ booking: b, name }) => matchesSearch(query, name, b.bookingReference, b.plateNumber));
    const page = usePage(rows, 8);
    return <><TripBanner /><AdminPanel>
        <AdminHeading title="Passenger manifest" detail={`${s.paidPassengers} paid passengers · ${s.motorcycles} motorcycles`}><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/boarding`)}>Boarding records</AdminButton></AdminHeading>
        <AdminField label="Search passengers" icon="user" type="search" placeholder="Search name, ticket ID or plate number" value={query} onChange={e => { setQuery(e.target.value); page.setPage(0); }} />
        <AdminTable label="Passenger manifest" className="admin-desktop-wide-table" columns={columns([["Passenger", 21], ["Ticket ID", 15], ["Motorcycle", 24], ["Source", 12], ["Trip", 15], ["Boarding", 13]])} empty={!rows.length && "No paid passengers match your search."}>
            {page.rows.map(({ booking: b, name, index, role }) => <tr key={`${b._id}-${index}`}><AdminCell label={name} detail={role} /><AdminCell label={b.bookingReference} /><AdminCell label={hasMotorcycle(b) ? index ? `With ${b.passengerName}` : b.motorcycleModel || "Motorcycle" : "—"} detail={hasMotorcycle(b) ? b.plateNumber : "Passenger only"} /><AdminCell label={sourceLabel(b)} /><AdminCell label={tripLabel(trip)} /><td>{boardingState(b) === "Boarded" ? <AdminStatus>Boarded</AdminStatus> : <><strong>Awaiting</strong><small>Paid ticket</small></>}</td></tr>)}
        </AdminTable><Pagination page={page} /><small>Accompanying passengers share the ticket holder's ticket.</small>
    </AdminPanel></>;
}

export function AdminPayments() {
    const { statistics: s, selectedTrip: trip, basePath, preview, bookings } = useAdminWorkspace();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const payment = bookings.find(b => b._id === params.get("payment"));
    const page = usePage(s.records, 8);
    const close = () => setParams({}, { replace: true });
    return <>
        <div className="staff-metrics staff-metrics-three">
            <AdminMetric label="Successful collections" value={money(s.revenue)} detail={`${tripLabel(trip)} · paid sales only`} />
            <AdminMetric label="Processing attempts" value={s.records.filter(b => paymentState(b) === "Processing").length} detail="Payment awaiting confirmation" />
            <AdminMetric label="Failed attempts" value={s.records.filter(b => paymentState(b) === "Failed").length} detail="Payment rejected" />
        </div>
        <AdminPanel><AdminHeading title="Transactions" detail={`Selected trip · ${tripLabel(trip)}`}><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/tickets`)}>Ticket records</AdminButton></AdminHeading>
            <AdminTable label="Payment transactions" className="admin-desktop-wide-table" columns={columns([["Reference / customer", 26], ["Ticket", 19], ["Method", 16], ["Amount", 13], ["Time", 13], ["Status", 13]])} empty={!s.records.length && "No payment records for this trip."}>
                {page.rows.map(b => <tr key={b._id} data-selected={b._id === payment?._id}><td><button type="button" className="admin-desktop-row-button" aria-label={`View payment ${paymentReference(b)}`} onClick={() => setParams({ payment: b._id })}><strong>{paymentReference(b)} · {b.passengerName}</strong><small>{sourceLabel(b)}{!isPaid(b) ? " attempt" : ""}</small></button></td>
                    <AdminCell label={isPaid(b) ? b.bookingReference : "Not valid for boarding"} detail={isPaid(b) ? "" : paymentState(b) === "Failed" ? "Payment unsuccessful" : "Awaiting confirmation"} /><AdminCell label={b.paymentMethod || "—"} /><AdminCell label={money(paymentAmount(b))} /><AdminCell label={formatTimestamp(paymentTime(b))} /><td><AdminStatus>{paymentState(b)}</AdminStatus></td></tr>)}
            </AdminTable>{page.total > page.size && <Pagination page={page} />}
            <div className="admin-desktop-payment-note"><p>A valid online ticket requires successful payment.</p><small>Processing and failed payments are excluded from paid-ticket and boarding totals.</small></div>
        </AdminPanel>
        {payment && <AdminDialog title="Payment details" onClose={close}>
            <div className="staff-form-stack"><AdminStatus>{paymentState(payment)}</AdminStatus><AdminDetail label="Reference">{paymentReference(payment)}</AdminDetail><AdminDetail label="Customer">{payment.passengerName}</AdminDetail><AdminDetail label="Amount & method">{money(paymentAmount(payment))} · {payment.paymentMethod}</AdminDetail><AdminDetail label="Ticket">{isPaid(payment) ? payment.bookingReference : "Awaiting successful payment"}</AdminDetail><AdminDetail label="Ride">{payment.vesselName || payment.ferryName} · {payment.origin} → {payment.destination} · {payment.date} · {formatTime(payment.time)}</AdminDetail><AdminDetail label="Recorded at">{formatTimestamp(paymentTime(payment), true)}</AdminDetail>
                {!preview && paymentState(payment) === "Processing" && <a className="admin-desktop-legacy" href={`/admin/payment-verification?payment=${encodeURIComponent(payment._id || payment.id || payment.paymentId || "")}`}>Open payment verification</a>}
                <AdminButton variant="secondary" onClick={close}>Close details</AdminButton></div>
        </AdminDialog>}
    </>;
}

export function AdminBoarding() {
    const { statistics: s, selectedTrip: trip, basePath } = useAdminWorkspace();
    const navigate = useNavigate();
    const rows = [...s.paid].sort((a, b) => Number(b.boardingStatus === "ON BOARD") - Number(a.boardingStatus === "ON BOARD") || new Date(b.boardedAt || 0) - new Date(a.boardedAt || 0));
    const page = usePage(rows, 8);
    return <><TripBanner status /><div className="staff-metrics staff-metrics-three">
        <AdminMetric label="Passengers boarded" value={`${s.boardedPassengers} / ${s.paidPassengers}`} detail={`${s.paidPassengers - s.boardedPassengers} paid passengers awaiting`} />
        <AdminMetric label="Motorcycles boarded" value={`${s.boardedMotorcycles} / ${s.motorcycles}`} detail={`${s.motorcycles - s.boardedMotorcycles} paid motorcycles awaiting`} />
        <AdminMetric label="Passenger capacity" value={`${s.paidPassengers} / ${trip?.passengerCapacity ?? "—"}`} detail={`${Math.max(0, (trip?.passengerCapacity ?? 0) - s.paidPassengers)} passenger places remain in the paid allocation`} />
    </div><AdminPanel><AdminHeading title="Boarding activity" detail="Tickets checked by terminal staff"><AdminButton variant="secondary" onClick={() => navigate(`${basePath}/passengers`)}>Passenger details</AdminButton></AdminHeading>
        <AdminTable label="Boarding activity" className="admin-desktop-wide-table" columns={columns([["Ticket / holder", 27], ["Source", 12], ["Passengers", 13], ["Motorcycles", 13], ["Verified at", 18], ["Status", 17]])} empty={!rows.length && "No paid tickets for this departure."}>
            {page.rows.map(b => <tr key={b._id}><AdminCell label={`${b.bookingReference} · ${b.passengerName}`} detail={tripLabel(trip)} /><AdminCell label={sourceLabel(b)} /><AdminCell label={String(passengerCount(b))} /><AdminCell label={hasMotorcycle(b) ? "1" : "0"} /><AdminCell label={formatTimestamp(b.boardedAt)} detail={b.boardedAt ? b.boardedByName || "Terminal staff" : "Awaiting scan"} /><td><AdminStatus>{boardingState(b)}</AdminStatus></td></tr>)}
        </AdminTable>{page.total > page.size && <Pagination page={page} />}<small>Ready = paid ticket awaiting boarding. Counts reflect passengers and motorcycles, not QR scans.</small>
    </AdminPanel></>;
}

export function AdminRecords() {
    const { events, date, preview } = useAdminWorkspace();
    const [query, setQuery] = useState("");
    const rows = events.filter(event => matchesSearch(query, event.event, event.detail, event.reference, event.actor, event.result));
    const page = usePage(rows, 8);
    return <AdminPanel><AdminHeading title="Activity log" detail={`${formatTripDate(date, true)} · Latest events first`} />
        <AdminField label="Search records" icon="password" type="search" placeholder="Search event, ticket or payment reference" value={query} onChange={e => { setQuery(e.target.value); page.setPage(0); }} />
        <AdminTable label="System activity" className="admin-desktop-wide-table" columns={columns([["Time", 13], ["Event", 24], ["Reference", 23], ["User / source", 21], ["Result", 19]])} empty={!rows.length && "No recorded events match this date and search."}>
            {page.rows.map(event => <tr key={event.id}><AdminCell label={formatTimestamp(event.time)} detail={formatTripDate(date, true)} /><AdminCell label={event.event} detail={event.detail} /><AdminCell label={event.reference} /><AdminCell label={event.actor} /><td>{event.result === "Saved" ? <><strong>Saved</strong><small>Schedule record</small></> : <AdminStatus>{event.result}</AdminStatus>}</td></tr>)}
        </AdminTable><Pagination page={page} />{!preview && <small>Activity is drawn from available record timestamps. Earlier status changes may not be retained.</small>}
    </AdminPanel>;
}
