import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffFlow } from "./StaffPreview";
import { sampleTickets } from "./staffPreviewApi";
import { StaffButton, StaffCapacity, StaffDetail, StaffDialog, StaffField, StaffIcon, StaffNotice, StaffPanel, StaffStatus } from "../../components/staff/StaffUI";
import { boardingIssue, extractBookingReference, formatTime, formatTimestamp, hasMotorcycle, matchesTrip, money, passengerCount, sourceLabel } from "./staffUtils";
import useTicketScanner from "./useTicketScanner";

const rejectionReasons = [
    "Passenger identity could not be verified.",
    "Booking information does not match the passenger.",
    "Payment has not been verified by admin.",
    "Invalid or unreadable boarding ticket.",
    "Other"
];

export default function StaffScanner({ trip, onRefresh, onHeading }) {
    const { api, basePath, preview } = useStaffFlow();
    const navigate = useNavigate();
    const [reference, setReference] = useState("");
    const [booking, setBooking] = useState(null);
    const [recorded, setRecorded] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState(rejectionReasons[0]);
    const [customReason, setCustomReason] = useState("");
    const request = useRef(null);
    const pending = useRef(false);
    const scanner = useTicketScanner(async text => {
        const parsed = extractBookingReference(text);
        await scanner.stop();
        if (!parsed) { setError("The QR code does not contain a ticket reference. Look up the ticket ID or scan again."); return; }
        setReference(parsed);
        await lookup(parsed);
    });
    const issue = booking ? boardingIssue(booking, trip) : null;
    const statistics = trip.statistics;

    useEffect(() => () => request.current?.abort(), []);
    useEffect(() => {
        const title = recorded ? "Boarding recorded" : booking ? (issue ? "Ticket cannot be boarded" : "Ticket verified") : "Verify a ticket";
        const subtitle = recorded ? "The paid ticket has been used for boarding." : booking ? (issue ? "Review the reason before assisting the passenger." : "Confirm the travelers and motorcycle details before recording boarding.") : "Scan a QR ticket or look it up by ticket ID before boarding.";
        onHeading({ title, subtitle });
    }, [booking, recorded, issue?.title, onHeading]);

    async function lookup(value) {
        if (pending.current) return;
        const ticket = value.trim();
        if (!/^[A-Za-z0-9-]+$/.test(ticket)) { setError("Enter a valid ticket ID or booking reference."); return; }
        pending.current = true;
        await scanner.stop();
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setBusy(true); setError(""); setMessage(""); setBooking(null); setRecorded(false);
        try {
            const { data } = await api.get(`/staff/bookings/reference/${encodeURIComponent(ticket)}`, { signal: controller.signal });
            if (!data.booking) throw new Error("Ticket details could not be retrieved.");
            setBooking(data.booking);
        } catch (err) {
            if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || "Unable to look up the ticket. Please retry.");
        } finally {
            if (!controller.signal.aborted) setBusy(false);
            pending.current = false;
        }
    }

    async function updateBooking(action, body = {}) {
        if (pending.current || !booking?._id) return;
        pending.current = true;
        setBusy(true); setError(""); setMessage("");
        try {
            const { data } = await api.put(`/staff/bookings/${booking._id}/${action}`, { ...body, tripId: trip.id });
            setBooking(data.booking);
            if (action === "board") setRecorded(true);
            else setMessage(data.message || "Ticket updated.");
            setRejecting(false);
            await onRefresh();
        } catch (err) {
            if (err.response?.data?.booking) setBooking(err.response.data.booking);
            setError(err.response?.data?.message || "Unable to update this ticket. Please retry.");
        } finally { setBusy(false); pending.current = false; }
    }

    const reset = () => { setBooking(null); setRecorded(false); setReference(""); setError(""); setMessage(""); };
    const companions = booking?.accompanyingPassengers?.length ? booking.accompanyingPassengers : (booking?.passengerDetails || []).slice(1).map(p => p.name);
    const motorcycle = booking && hasMotorcycle(booking);
    const canConfirmArrival = booking?.boardingStatus === "ON BOARD" && !booking.timedOutAt && matchesTrip(booking, trip) && booking.paymentStatus === "VERIFIED" && booking.status === "CONFIRMED";

    return <>
        <StaffNotice error>{error}</StaffNotice>
        <StaffNotice>{message}</StaffNotice>
        {!booking ? <div className="staff-two-panels">
            <StaffPanel>
                <h2>Scan QR ticket</h2><p>Place the ticket QR code inside the frame.</p>
                <div className={`staff-scanner-viewport ${scanner.scanning || scanner.starting ? "is-scanning" : ""}`}>
                    <div id="staff-qr-reader" />
                    {!scanner.scanning && !scanner.starting && <div className="staff-scanner-placeholder"><img src="/images/staff/3bbf7.svg" alt="" /><span>Align the QR code here</span></div>}
                    {scanner.starting && <span className="staff-camera-starting" role="status">Starting camera…</span>}
                </div>
                <StaffNotice error>{scanner.cameraError}</StaffNotice>
                <StaffButton disabled={busy || scanner.starting} onClick={scanner.scanning ? scanner.stop : scanner.start}>{scanner.starting ? "Starting camera…" : scanner.scanning ? "Stop camera" : "Verify scanned ticket"}</StaffButton>
                <small>Online tickets must be paid, valid for this trip and unused.</small>
            </StaffPanel>
            <StaffPanel>
                <h2>Ticket lookup</h2>
                <form className="staff-form-stack" onSubmit={event => { event.preventDefault(); lookup(reference); }}>
                    <StaffField label="Ticket ID" icon="ticketInput" placeholder="Enter booking reference" value={reference} onChange={e => setReference(e.target.value)} required disabled={busy} autoComplete="off" />
                    <StaffButton variant="secondary" type="submit" disabled={busy}>{busy ? "Looking up ticket…" : "Look up ticket"}</StaffButton>
                </form>
                {preview && <details className="staff-preview-tickets"><summary>Try a sample ticket</summary><div>{sampleTickets.map(ticket => <button type="button" key={ticket.reference} disabled={busy} onClick={() => { setReference(ticket.reference); void lookup(ticket.reference); }}>{ticket.label}</button>)}</div></details>}
                <hr /><h3>Before boarding</h3>
                <ul className="staff-check-list"><li><StaffIcon name="check" />Payment is confirmed</li><li><StaffIcon name="check" />Ticket matches the selected trip</li><li><StaffIcon name="check" />Ticket has not been boarded</li></ul>
                <small>A rejected ticket cannot be marked as boarded.</small>
            </StaffPanel>
        </div> : recorded ? <div className="staff-two-panels">
            <StaffPanel>
                <div className="staff-result-heading"><span className="staff-success-mark"><StaffIcon name="success" /></span><div><h2 className="staff-title-large">Boarding recorded</h2><p>{booking.passengerName} · {booking.bookingReference}</p></div></div>
                <div className="staff-summary-strip"><StaffDetail label="Passengers boarded">{passengerCount(booking)} {passengerCount(booking) === 1 ? "passenger" : "passengers"}</StaffDetail><StaffDetail label="Motorcycles boarded">{motorcycle ? "1 motorcycle" : "No motorcycle"}</StaffDetail></div>
                <StaffDetail label="Trip">{trip.vesselName} · {trip.route} · {formatTime(trip.departureTime)}</StaffDetail>
                <StaffDetail label="Recorded by">{booking.boardedByName || "Terminal staff"} · {formatTimestamp(booking.boardedAt)}</StaffDetail>
                <small>This ticket cannot be used to board again.</small>
                <StaffButton onClick={reset}>Scan next ticket</StaffButton>
                <StaffButton variant="secondary" onClick={() => navigate(`${basePath}/manifest`)}>View boarding manifest</StaffButton>
            </StaffPanel>
            <StaffPanel><h2>Updated boarding</h2><StaffCapacity label="Passengers boarded" used={statistics.boardedPassengers} total={statistics.paidPassengers} /><StaffCapacity label="Motorcycles boarded" used={statistics.boardedMotorcycles} total={statistics.motorcycles} /><p>{Math.max(0, statistics.paidPassengers - statistics.boardedPassengers)} paid passengers and {Math.max(0, statistics.motorcycles - statistics.boardedMotorcycles)} paid motorcycles are still awaiting boarding.</p></StaffPanel>
        </div> : issue ? <div className="staff-two-panels">
            <StaffPanel>
                <div className="staff-blocked-banner"><h2>{issue.title}</h2><p>{issue.detail}</p></div>
                <StaffDetail label="Ticket holder">{booking.passengerName}</StaffDetail>
                <div className="staff-details-grid"><StaffDetail label="Ticket">{booking.bookingReference}</StaffDetail><StaffDetail label="Payment">{booking.paymentStatus === "VERIFIED" ? "Paid" : "Not verified"} · {booking.paymentMethod}</StaffDetail></div>
                <StaffDetail label="Original trip">{booking.vesselName || booking.ferryName || "Ferry"} · {booking.origin} → {booking.destination} · {formatTime(booking.time)}</StaffDetail>
                <hr /><StaffButton disabled>Mark as boarded</StaffButton>
                <StaffButton onClick={reset}>Scan another ticket</StaffButton>
                {canConfirmArrival && <StaffButton variant="secondary" disabled={busy} onClick={() => updateBooking("timeout")}>{busy ? "Recording arrival…" : "Confirm arrival / time out"}</StaffButton>}
                {booking.boardingStatus === "NOT BOARDED" && <StaffButton variant="text" disabled={busy} onClick={() => setRejecting(true)}>Reject boarding with a reason</StaffButton>}
            </StaffPanel>
            <StaffPanel><h2>Assist the passenger</h2><p>Confirm that the passenger is presenting the correct ticket. Refer unresolved ticket concerns to the administrator.</p><hr /><h3>Other rejection reasons</h3><p>Payment is not confirmed<br />Ticket belongs to another trip<br />Ticket ID is invalid</p><small className="staff-warning-text">Unpaid tickets are not valid for boarding.</small></StaffPanel>
        </div> : <div className="staff-two-panels">
            <StaffPanel>
                <div className="staff-result-heading"><span className="staff-valid-mark"><StaffIcon name="valid" /></span><div><h2 className="staff-title-large">Valid for boarding</h2><p>{booking.bookingReference} · {sourceLabel(booking)} ticket</p></div><StaffStatus>Paid</StaffStatus></div>
                <hr />
                <div className="staff-details-grid">
                    <StaffDetail label="Ticket holder">{booking.passengerName}</StaffDetail><StaffDetail label="Accompanying passenger">{companions?.join(", ") || "None"}</StaffDetail>
                    <StaffDetail label="Motorcycle">{motorcycle ? booking.motorcycleModel || "Motorcycle" : "Passenger only"}</StaffDetail><StaffDetail label="Plate number">{booking.plateNumber || "—"}</StaffDetail>
                    <StaffDetail label="Payment confirmed">{money(booking.totalPaid ?? booking.requiredAmount)} · {booking.paymentMethod}</StaffDetail><StaffDetail label="Paid at">{formatTimestamp(booking.paidAt, true)}</StaffDetail>
                </div>
                <div className="staff-summary-strip"><StaffDetail label="Passengers">{passengerCount(booking)}</StaffDetail><StaffDetail label="Motorcycles">{motorcycle ? 1 : 0}</StaffDetail></div>
                <small>Marking this ticket boarded records {passengerCount(booking)} {passengerCount(booking) === 1 ? "passenger" : "passengers"} and {motorcycle ? "1 motorcycle" : "0 motorcycles"}.</small>
                <StaffButton disabled={busy} onClick={() => updateBooking("board")}>{busy ? "Recording boarding…" : "Mark as boarded"}</StaffButton>
                <StaffButton variant="secondary" disabled={busy} onClick={reset}>Back to scanner</StaffButton>
                <StaffButton variant="text" disabled={busy} onClick={() => setRejecting(true)}>Reject boarding with a reason</StaffButton>
            </StaffPanel>
            <StaffPanel><h2>Verification checks</h2><ul className="staff-check-list staff-check-details"><li><StaffIcon name="check" /><div><strong>Payment confirmed</strong><small>Verified {sourceLabel(booking).toLowerCase()} payment</small></div></li><li><StaffIcon name="check" /><div><strong>Correct trip</strong><small>{trip.vesselName} · {trip.route}</small></div></li><li><StaffIcon name="check" /><div><strong>Not yet boarded</strong><small>No previous boarding record</small></div></li></ul><hr /><h3>Trip boarding totals</h3><StaffDetail label="Before this ticket">{statistics.boardedPassengers} / {statistics.paidPassengers} passengers · {statistics.boardedMotorcycles} / {statistics.motorcycles} motorcycles</StaffDetail><StaffDetail label="After boarding">{statistics.boardedPassengers + passengerCount(booking)} / {statistics.paidPassengers} passengers · {statistics.boardedMotorcycles + (motorcycle ? 1 : 0)} / {statistics.motorcycles} motorcycles</StaffDetail></StaffPanel>
        </div>}
        {rejecting && <StaffDialog title="Reject boarding" onClose={() => !busy && setRejecting(false)}>
            <p>The reason will be saved with ticket <strong>{booking.bookingReference}</strong> and shown to the passenger.</p>
            <form className="staff-form-stack" onSubmit={event => { event.preventDefault(); updateBooking("reject", { reason: reason === "Other" ? customReason.trim() : reason }); }}>
                <label className="staff-field">Reason for rejection<select value={reason} onChange={e => setReason(e.target.value)} disabled={busy}>{rejectionReasons.map(item => <option key={item}>{item}</option>)}</select></label>
                {reason === "Other" && <label className="staff-field">Your reason<textarea value={customReason} onChange={e => setCustomReason(e.target.value)} maxLength={500} required disabled={busy} rows={4} /></label>}
                <StaffNotice error>{error}</StaffNotice>
                <div className="staff-actions"><StaffButton variant="secondary" disabled={busy} onClick={() => setRejecting(false)}>Cancel</StaffButton><StaffButton variant="danger" type="submit" disabled={busy || (reason === "Other" && !customReason.trim())}>{busy ? "Rejecting…" : "Confirm rejection"}</StaffButton></div>
            </form>
        </StaffDialog>}
    </>;
}
