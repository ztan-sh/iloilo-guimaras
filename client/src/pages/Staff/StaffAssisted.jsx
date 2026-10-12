import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { StaffButton, StaffDialog, StaffNotice, StaffStatus } from "../../components/staff/StaffUI";
import { OperationsPanel, PassengerFields, PencilField, VesselSelector } from "../../components/operations/OperationsUI";
import { DEFAULT_PRICES, discountCategory, operationsStore, passengerIdentity, personIssue, quoteRide } from "../../components/operations/operationsStore";
import { useOperations } from "../../components/operations/useOperations";
import { useStaffFlow } from "./StaffPreview";
import { formatTime, money } from "./staffUtils";
import { createId } from "../../utils/createId.js";

const blankPerson = () => ({ id: createId(), name: "", age: "", gender: "", category: "Regular" });
const initialDraft = () => ({ saleId: createId(), passengers: [{ id: "sample-regular-sarah", name: "Sarah Fukiko", age: 24, gender: "Female", category: "Regular", savedProfile: true }], motorcycle: false, model: "", plate: "", regularFare: false, paymentSignature: "", ticketId: "" });
export default function StaffAssisted({ trip, trips, onSelectTrip, onRefresh }) {
    const { api, preview, basePath } = useStaffFlow();
    const ops = useOperations(preview);
    const navigate = useNavigate();
    const [initial] = useState(initialDraft);
    const draft = ops.drafts[trip.id] || initial;
    const [register, setRegister] = useState(null);
    const [registerError, setRegisterError] = useState("");
    const [photoPerson, setPhotoPerson] = useState(null);
    const [photo, setPhoto] = useState("");
    const [photoError, setPhotoError] = useState("");
    const [cash, setCash] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const pending = useRef(false);
    const prices = ops.prices[trip.vesselName] || DEFAULT_PRICES;
    const quote = quoteRide(prices, draft.passengers, draft.motorcycle, ops.requests, draft.regularFare);
    const signature = JSON.stringify([trip.id, draft.passengers, draft.motorcycle, draft.model, draft.plate, draft.regularFare, quote, prices]);
    const paid = draft.paymentSignature === signature;
    const ticket = ops.bookings.find(item => item._id === draft.ticketId);
    const update = patch => { operationsStore.saveDraft(trip.id, { ...draft, ...patch, paymentSignature: "" }); setError(""); };
    const s = trip.statistics;
    const full = s.paidPassengers + draft.passengers.length > s.passengerCapacity || (draft.motorcycle && (s.walkInMotorcycles >= s.walkInMotorcycleCapacity || s.motorcycles >= s.motorcycleCapacity));
    const missingApproval = !draft.regularFare && draft.passengers.some(person => discountCategory(person) !== "Regular" && !ops.requests.some(request => request.identity === passengerIdentity(person) && request.status === "approved" && request.photo));
    const incomplete = draft.passengers.some(person => personIssue(person)) || (draft.motorcycle && (!draft.model.trim() || !draft.plate.trim()));
    const count = amount => update({ passengers: Array.from({ length: amount }, (_, index) => draft.passengers[index] || blankPerson()), regularFare: false });
    const setPerson = (index, person) => update({ passengers: draft.passengers.map((item, i) => i === index ? person : item), regularFare: false });
    const issue = async () => {
        if (pending.current || !paid || incomplete || missingApproval || full) return;
        pending.current = true; setBusy(true); setError("");
        try {
            const { data } = await api.post("/staff/walk-in", { operations: true, tripId: trip.id, date: trip.date, saleId: draft.saleId, passengerName: draft.passengers[0].name.trim(), passengers: draft.passengers.length,
                passengerDetails: draft.passengers, accompanyingPassengers: draft.passengers.slice(1).map(person => person.name.trim()), vehicleType: draft.motorcycle ? "Motorcycle" : "No Motorcycle", motorcycleModel: draft.model.trim(), plateNumber: draft.plate.trim(), paymentReceived: true, totalCollected: quote.total, regularFare: draft.regularFare });
            operationsStore.saveDraft(trip.id, { ...draft, ticketId: data.booking._id });
            await onRefresh();
        } catch (err) { setError(err.response?.data?.message || "Unable to issue this ticket. Retry this sale after refreshing to avoid a duplicate."); }
        finally { pending.current = false; setBusy(false); }
    };
    const upload = async file => {
        setPhoto(""); setPhotoError("");
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setPhotoError("Choose a JPG, PNG or WebP image smaller than 5 MB."); return; }
        const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.onerror = () => setPhotoError("Unable to read that photo. Choose another image."); reader.readAsDataURL(file);
    };
    if (!preview) return <OperationsPanel><h2>Assisted ticket booking</h2><p>The new account-linked booking and individual ID workflow is available in the frontend preview. Live assisted booking needs customer-registration and discount-review APIs.</p><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/walk-in`)}>Open terminal cash ticketing</StaffButton></OperationsPanel>;
    if (ticket) return <div className="staff-two-panels"><OperationsPanel><div className="staff-section-heading"><h2>Paid ticket issued</h2><StaffStatus>Paid</StaffStatus></div><div className="staff-issued-ticket"><QRCodeSVG value={JSON.stringify({ type: "FERRY_TICKET", bookingReference: ticket.bookingReference })} size={160} marginSize={2} /><strong>{ticket.bookingReference}</strong><p>{ticket.passengerName}</p><p>{trip.vesselName} · {trip.route} · {formatTime(trip.departureTime)}</p></div><div className="staff-actions"><StaffButton onClick={() => window.print()}>Print ticket</StaffButton><StaffButton variant="secondary" onClick={() => operationsStore.saveDraft(trip.id, initialDraft())}>Book another ticket</StaffButton></div></OperationsPanel><OperationsPanel><h2>Payment receipt</h2><div className="operations-summary-line"><span>Cash confirmed</span><strong>{money(ticket.totalPaid)}</strong></div><p>{ticket.passengers} passengers · {ticket.vehicleType}</p><p>The recorded fare and individual discounts are retained if vessel prices change later.</p><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/bookings?booking=${encodeURIComponent(ticket._id)}`)}>Booking passenger details</StaffButton></OperationsPanel></div>;
    return <>
        <StaffNotice error>{error}</StaffNotice>
        <fieldset className="staff-two-panels operations-assisted-fields" disabled={busy}>
            <OperationsPanel><h2>Assisted booking</h2><div><h3>Choose a vessel</h3><VesselSelector value={trip.vesselName} available={[...new Set(trips.map(item => item.vesselName))]} onChange={vessel => { const next = trips.find(item => item.vesselName === vessel && item.route === trip.route) || trips.find(item => item.vesselName === vessel); if (next) onSelectTrip(next.id); }} /></div>
                <div className="operations-vessels" role="group" aria-label="Motorcycle selection">{[false, true].map(value => <StaffButton key={String(value)} variant="secondary" className={draft.motorcycle === value ? "is-selected" : ""} aria-pressed={draft.motorcycle === value} onClick={() => update({ motorcycle: value, passengers: value ? draft.passengers.slice(0, 3) : draft.passengers, regularFare: false })}>{value ? "With motorcycle" : "No motorcycle"}</StaffButton>)}</div>
                <div className="operations-counter"><h3>Passengers</h3><div><StaffButton variant="secondary" aria-label="Remove passenger" disabled={draft.passengers.length === 1} onClick={() => count(draft.passengers.length - 1)}>−</StaffButton><strong aria-live="polite">{draft.passengers.length} {draft.passengers.length === 1 ? "passenger" : "passengers"}</strong><StaffButton variant="secondary" aria-label="Add passenger" disabled={draft.passengers.length >= (draft.motorcycle ? 3 : 10)} onClick={() => count(draft.passengers.length + 1)}>+</StaffButton></div></div><p>Maximum {draft.motorcycle ? 3 : 10} passengers {draft.motorcycle ? "with" : "without"} a motorcycle.</p>
                <div className="operations-inset"><h3>Passenger 1 · Saved account profile</h3><strong>{draft.passengers[0].name}</strong><p>Age {draft.passengers[0].age} · {draft.passengers[0].gender} · {discountCategory(draft.passengers[0])}</p><p>Use linked account details for Passenger 1. Register a new customer before assisted booking.</p></div>
                <div className="staff-actions"><StaffButton variant="secondary" onClick={() => { setRegister(blankPerson()); setRegisterError(""); }}>Register a new customer</StaffButton><StaffButton variant="secondary" disabled={discountCategory(draft.passengers[0]) === "Regular"} onClick={() => { setPhotoPerson(draft.passengers[0]); setPhoto(""); setPhotoError(""); }}>Review Passenger 1 ID</StaffButton></div>
                {draft.passengers.slice(1).map((person, i) => <div className="operations-companion" key={person.id}><h3>Passenger {i + 2}</h3><PassengerFields person={person} prefix={`Passenger ${i + 2}`} onChange={value => setPerson(i + 1, value)} /><StaffButton variant="secondary" disabled={!!personIssue(person) || discountCategory(person) === "Regular"} onClick={() => { setPhotoPerson(person); setPhoto(""); setPhotoError(""); }}>Review Passenger {i + 2} ID</StaffButton></div>)}
                {draft.motorcycle && <div className="staff-details-grid"><PencilField label="Motorcycle model" required value={draft.model} onChange={e => update({ model: e.target.value })} maxLength={100} /><PencilField label="Plate number" required value={draft.plate} onChange={e => update({ plate: e.target.value })} maxLength={30} /></div>}
            </OperationsPanel>
            <OperationsPanel><h2>Booking summary</h2><p>{trip.vesselName} · {draft.motorcycle ? "With motorcycle" : "No motorcycle"} · {draft.passengers.length} {draft.passengers.length === 1 ? "passenger" : "passengers"}</p>
                {[["Passenger fares", quote.passengerFare], ...(draft.motorcycle ? [["Motorcycle charge", quote.motorcycleFare]] : []), ["Approved discounts", -quote.discount], ["PPA fee", quote.ppa], ["Total to collect", quote.total]].map(([label, value]) => <div className="operations-summary-line" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}
                <p>Apply an approved discount once per eligible passenger. Motorcycle charges and PPA fees are excluded.</p>
                {missingApproval && <StaffNotice error>An eligible passenger is awaiting ID approval. Review their ID, or explicitly use the regular fare.</StaffNotice>}
                <StaffButton variant="secondary" aria-pressed={draft.regularFare} onClick={() => update({ regularFare: !draft.regularFare })}>{draft.regularFare ? "Apply approved discounts" : "Use regular fare"}</StaffButton>{draft.regularFare && <small>Regular fare selected for every passenger in this booking.</small>}
                <StaffNotice error={!paid}><strong>{paid ? "Cash payment confirmed" : "Payment not confirmed"}</strong><p>{paid ? "Issue the paid ticket after checking all passenger details." : "Confirm collected cash before issuing this ticket."}</p></StaffNotice>
                <StaffButton variant="secondary" disabled={!!incomplete || missingApproval || full || paid || busy} onClick={() => setCash(true)}>Confirm cash payment</StaffButton><StaffButton disabled={!paid || !!incomplete || missingApproval || full || busy} onClick={issue}>{busy ? "Issuing ticket…" : "Issue paid ticket"}</StaffButton>
                {!!incomplete && <small>Complete every passenger’s details{draft.motorcycle ? " and motorcycle information" : ""} first.</small>}{full && <StaffNotice error>Insufficient passenger or walk-in motorcycle allocation for this departure.</StaffNotice>}
                <small>{s.paidPassengers} / {s.passengerCapacity} paid passengers · {s.walkInMotorcycles} / {s.walkInMotorcycleCapacity} walk-in motorcycles</small>
            </OperationsPanel>
        </fieldset>
        {register && <StaffDialog title="Register a new customer" onClose={() => setRegister(null)}><p>Create a temporary customer profile for this preview booking.</p><form className="staff-form-stack" onSubmit={e => { e.preventDefault(); const problem = personIssue(register); if (problem) { setRegisterError(problem); return; } setPerson(0, { ...register, age: Number(register.age), savedProfile: true }); setRegister(null); }}><StaffNotice error>{registerError}</StaffNotice><PassengerFields prefix="Customer" person={register} onChange={person => { setRegister(person); setRegisterError(""); }} /><StaffButton type="submit">Use customer profile</StaffButton></form></StaffDialog>}
        {photoPerson && <StaffDialog title={`Review ${photoPerson.name} ID`} onClose={() => setPhotoPerson(null)}><p>{discountCategory(photoPerson)} · Each passenger needs their own matching ID photo.</p>{(() => { const request = ops.requests.find(item => item.identity === passengerIdentity(photoPerson) && item.status !== "requested"); return request ? <><StaffNotice>{request.status === "approved" ? "This passenger’s ID is approved." : "This passenger’s ID is awaiting staff review."}</StaffNotice><StaffButton onClick={() => navigate(`${basePath}/discounts?request=${encodeURIComponent(request.id)}`)}>Open ID review</StaffButton></> : <><label className="staff-field">Passenger ID photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload(e.target.files?.[0])} /></label>{photo && <img className="operations-id-photo" src={photo} alt="Selected passenger ID" />}<StaffNotice error>{photoError}</StaffNotice><StaffButton disabled={!photo} onClick={() => { try { const id = operationsStore.requestID(photoPerson, photo); navigate(`${basePath}/discounts?request=${encodeURIComponent(id)}`); } catch (err) { setPhotoError(err.message); } }}>Submit and review ID</StaffButton></>; })()}</StaffDialog>}
        {cash && <StaffDialog title="Confirm collected cash" onClose={() => setCash(false)}><p>Confirm that you collected {money(quote.total)} for this exact booking.</p><StaffNotice>{draft.passengers.length} passengers · {trip.vesselName} · {trip.route}</StaffNotice><div className="staff-actions"><StaffButton variant="secondary" onClick={() => setCash(false)}>Cancel</StaffButton><StaffButton disabled={!!incomplete || missingApproval || full} onClick={() => { operationsStore.saveDraft(trip.id, { ...draft, paymentSignature: signature }); setCash(false); }}>I collected {money(quote.total)}</StaffButton></div></StaffDialog>}
    </>;
}
