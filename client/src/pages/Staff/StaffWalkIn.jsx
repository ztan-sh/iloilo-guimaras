import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useStaffFlow } from "./StaffPreview";
import { StaffButton, StaffDetail, StaffField, StaffNotice, StaffPanel, StaffStatus } from "../../components/staff/StaffUI";
import { formatTime, formatTripDate, money, todayInManila } from "./staffUtils";

const newSaleId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, "0")).join("");
const emptyForm = { passengerName: "", contactNumber: "", vehicleType: "Motorcycle", motorcycleModel: "", plateNumber: "", passengers: 1, companions: [], paymentReceived: false };

export default function StaffWalkIn({ trip, fares, onRefresh }) {
    const { api, preview } = useStaffFlow();
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [ticket, setTicket] = useState(null);
    const saleId = useRef(newSaleId());
    const submitted = useRef(false);
    const pending = useRef(false);
    const motorcycle = form.vehicleType === "Motorcycle";
    const total = form.passengers * fares.passenger + (motorcycle ? fares.motorcycle : 0) + fares.ppa;
    const s = trip.statistics;
    const departurePassed = !preview && (trip.date !== todayInManila() || new Date(`${trip.date}T${trip.departureTime}:00+08:00`) <= new Date());
    const full = s.paidPassengers + form.passengers > s.passengerCapacity || (motorcycle && (s.walkInMotorcycles >= s.walkInMotorcycleCapacity || s.motorcycles >= s.motorcycleCapacity));
    const update = (key, value) => setForm(current => ({ ...current, [key]: value, paymentReceived: key === "paymentReceived" ? value : false }));
    const updateCount = count => setForm(current => ({ ...current, passengers: count, companions: Array.from({ length: count - 1 }, (_, i) => current.companions[i] || ""), paymentReceived: false }));

    const submit = async event => {
        event.preventDefault();
        if (pending.current || full || departurePassed) return;
        pending.current = true; submitted.current = true;
        setBusy(true); setError("");
        try {
            const { data } = await api.post("/staff/walk-in", {
                tripId: trip.id, ...(preview ? { date: trip.date } : {}), saleId: saleId.current, passengerName: form.passengerName.trim(), contactNumber: form.contactNumber.trim(),
                passengers: form.passengers, accompanyingPassengers: form.companions.map(n => n.trim()), vehicleType: form.vehicleType,
                motorcycleModel: form.motorcycleModel.trim(), plateNumber: form.plateNumber.trim(), totalCollected: total, paymentReceived: form.paymentReceived
            });
            setTicket(data.booking);
            await onRefresh();
        } catch (err) {
            if ([400, 409].includes(err.response?.status)) submitted.current = false;
            setError(err.response?.data?.message || "Unable to record the ticket. Retry this sale to avoid issuing a duplicate.");
        }
        finally { setBusy(false); pending.current = false; }
    };

    const reset = () => { setTicket(null); setForm(emptyForm); setError(""); saleId.current = newSaleId(); submitted.current = false; };

    return <>
        <StaffNotice error>{error}</StaffNotice>
        {ticket ? <div className="staff-two-panels">
            <StaffPanel><div className="staff-section-heading"><h2>Paid ticket recorded</h2><StaffStatus>Paid</StaffStatus></div><p>The passenger can present this QR ticket at boarding.</p><div className="staff-issued-ticket"><QRCodeSVG value={JSON.stringify({ type: "FERRY_TICKET", bookingReference: ticket.bookingReference })} size={160} marginSize={2} /><strong>{ticket.bookingReference}</strong><p>{ticket.passengerName}</p><p>{trip.route} · {formatTime(trip.departureTime)}</p></div><StaffButton onClick={() => window.print()}>Print ticket</StaffButton><StaffButton variant="secondary" onClick={reset}>Record another ticket</StaffButton></StaffPanel>
            <StaffPanel><h2>Sale receipt</h2><StaffDetail label="Ticket holder">{ticket.passengerName}</StaffDetail><StaffDetail label="Departure">{formatTripDate(trip.date)} · {formatTime(trip.departureTime)}</StaffDetail><StaffDetail label="Passengers">{ticket.passengers}</StaffDetail><StaffDetail label="Payment">Cash · {money(ticket.totalPaid)}</StaffDetail><StaffDetail label="Boarding">Awaiting boarding</StaffDetail></StaffPanel>
        </div> : <div className="staff-two-panels">
            <StaffPanel>
                <h2>Passenger &amp; motorcycle</h2>
                <form className="staff-form-stack" onSubmit={submit}>
                    <fieldset disabled={busy || submitted.current} className="staff-walk-in-fields">
                        <div className="staff-details-grid">
                            <StaffField label="Passenger name" icon="account" value={form.passengerName} onChange={e => update("passengerName", e.target.value)} placeholder="Full name" autoComplete="name" required maxLength={150} />
                            <StaffField label="Contact number" icon="account" type="tel" value={form.contactNumber} onChange={e => update("contactNumber", e.target.value)} placeholder="Mobile number (optional)" autoComplete="tel" maxLength={30} />
                            <label className="staff-field">Ticket type<select value={form.vehicleType} onChange={e => { update("vehicleType", e.target.value); if (e.target.value === "Motorcycle" && form.passengers > 3) updateCount(3); }}><option>Motorcycle</option><option value="No Motorcycle">Passenger only</option></select></label>
                            <label className="staff-field">Number of passengers<select value={form.passengers} onChange={e => updateCount(Number(e.target.value))}>{Array.from({ length: motorcycle ? 3 : 10 }, (_, i) => <option value={i + 1} key={i}>{i + 1} {i ? "passengers" : "passenger"}</option>)}</select></label>
                            {motorcycle && <><StaffField label="Motorcycle model" icon="ticketInput" value={form.motorcycleModel} onChange={e => update("motorcycleModel", e.target.value)} placeholder="e.g. Honda Click" required maxLength={100} /><StaffField label="Plate number" icon="ticketInput" value={form.plateNumber} onChange={e => update("plateNumber", e.target.value)} placeholder="e.g. ABC 1234" required maxLength={30} /></>}
                            {form.companions.map((name, index) => <StaffField key={index} label={`Accompanying passenger ${index + 1}`} icon="account" value={name} onChange={e => { const names = [...form.companions]; names[index] = e.target.value; update("companions", names); }} placeholder="Full name" required maxLength={150} />)}
                        </div>
                        <hr />
                        <div className="staff-summary-strip"><StaffDetail label="Payment method">Cash · {money(total)}</StaffDetail><StaffDetail label="Payment status">{form.paymentReceived ? "Paid at terminal" : "Awaiting cash payment"}</StaffDetail></div>
                        <label className="staff-payment-check"><input type="checkbox" checked={form.paymentReceived} onChange={e => update("paymentReceived", e.target.checked)} required />I have collected {money(total)} in cash.</label>
                    </fieldset>
                    {departurePassed && <StaffNotice error>Select an upcoming departure for today to sell a terminal ticket.</StaffNotice>}
                    {full && <StaffNotice error>{motorcycle && s.walkInMotorcycleCapacity === 0 ? "No walk-in motorcycle allocation is configured for this trip. Passenger-only tickets remain available." : "There is insufficient passenger or walk-in motorcycle capacity for this sale."}</StaffNotice>}
                    <StaffButton type="submit" disabled={busy || !form.paymentReceived || full || departurePassed}>{busy ? "Recording ticket…" : submitted.current ? "Retry this paid ticket" : "Record paid ticket"}</StaffButton>
                    <small>Confirm payment before issuing the ticket. Unpaid reservations are unavailable.</small>
                </form>
            </StaffPanel>
            <StaffPanel><h2>Sale summary</h2><StaffDetail label="Route & departure">{trip.route} · {formatTime(trip.departureTime)}</StaffDetail><StaffDetail label="Ticket type">Walk-in · {form.passengers} {form.passengers === 1 ? "passenger" : "passengers"} · {motorcycle ? "1 motorcycle" : "Passenger only"}</StaffDetail><StaffDetail label="Passenger fare">{money(form.passengers * fares.passenger)}</StaffDetail>{motorcycle && <StaffDetail label="Motorcycle fare">{money(fares.motorcycle)}</StaffDetail>}<StaffDetail label="PPA fee">{money(fares.ppa)}</StaffDetail><StaffDetail label="Total to collect">{money(total)}</StaffDetail><hr /><h3>Available allocation</h3><StaffDetail label="Walk-in motorcycles used">{s.walkInMotorcycles} / {s.walkInMotorcycleCapacity}</StaffDetail><StaffDetail label="Paid passenger capacity">{s.paidPassengers} / {s.passengerCapacity}</StaffDetail><StaffDetail label="Paid motorcycle capacity">{s.motorcycles} / {s.motorcycleCapacity}</StaffDetail></StaffPanel>
        </div>}
    </>;
}
