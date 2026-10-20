import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StaffButton, StaffDialog, StaffNotice, StaffStatus } from "../staff/StaffUI";
import { OperationsPanel } from "./OperationsUI";
import { discountCategory, passengerIdentity } from "./operationsStore";
import { useOperations } from "./useOperations";
import { boardingIssue, hasMotorcycle, money, passengerCount } from "../../pages/Staff/staffUtils";

export function bookingPassengers(booking) {
    return Array.from({ length: passengerCount(booking) }, (_, index) => {
        const details = booking.passengerDetails?.[index] || {};
        return { ...details, id: details.passengerId || details.id || `${booking._id}-passenger-${index}`, name: details.name || (index ? booking.accompanyingPassengers?.[index - 1]?.name || booking.accompanyingPassengers?.[index - 1] : booking.passengerName) || `Passenger ${index + 1}`, age: details.age ?? (index === 0 ? booking.passengerAge : undefined), gender: details.gender || (index === 0 ? booking.passengerGender : ""), category: details.category || "", savedProfile: details.savedProfile || false };
    });
}
export default function BookingDetails({ role, preview, basePath, bookings, trip, api, onRefresh, onSelectRelatedTrip }) {
    const ops = useOperations(preview);
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const booking = bookings.find(item => item._id === params.get("booking")) || (!params.get("booking") ? bookings[0] : null);
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [liveRequests, setLiveRequests] = useState([]);
    useEffect(() => {
        if (preview || !api) return;
        let active = true;
        api.get(role === "staff" ? "/staff/discount-requests" : "/admin/discount-requests")
            .then(({ data }) => {
                if (active) setLiveRequests((data.requests || []).map(item => ({
                    id: item._id,
                    requestId: item._id,
                    passengerId: item.passengerId,
                    passenger: { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category },
                    identity: passengerIdentity({ id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category }),
                    photo: item.photo,
                    status: item.status,
                    reason: item.reason || "",
                    source: item.source || ""
                })));
            })
            .catch(() => { if (active) setLiveRequests([]); });
        return () => { active = false; };
    }, [api, preview, role]);
    const issue = booking ? boardingIssue(booking, trip) : null;
    const board = async () => {
        if (busy || issue) return;
        setBusy(true); setError("");
        try { await api.put(`/staff/bookings/${booking._id}/board`, { tripId: trip.id }); await onRefresh(); setMessage("Boarding recorded successfully."); setConfirm(false); }
        catch (err) { setError(err.response?.data?.message || "Unable to record boarding. Retry after refreshing the ticket."); }
        finally { setBusy(false); }
    };
    if (!booking) return <OperationsPanel><h2>{params.get("booking") ? "Booking unavailable" : "No booking records"}</h2><p>{params.get("booking") ? "This booking may have been reset, or is not available in this workspace." : "Passenger details will appear once a booking has been recorded."}</p><StaffButton variant="secondary" onClick={() => { setParams({}); navigate(`${basePath}/${role === "staff" ? "manifest" : "tickets"}`); }}>Back to records</StaffButton></OperationsPanel>;
    const passengers = bookingPassengers(booking);
    const paid = booking.paymentStatus === "VERIFIED" && booking.status === "CONFIRMED";
    const review = person => {
        const request = (preview ? ops.requests : liveRequests).findLast(item => item.id === person.discountRequestId || item.passengerId === person.id || item.identity === passengerIdentity(person));
        navigate(`${basePath}/discounts${request ? `?request=${encodeURIComponent(request.id)}` : ""}`);
    };
    return <>
        <label className="staff-field operations-booking-picker">Booking record<select value={booking._id} onChange={e => { setParams({ booking: e.target.value }); setMessage(""); setError(""); }}>{bookings.map(item => <option key={item._id} value={item._id}>{item.bookingReference} · {item.passengerName}</option>)}</select></label>
        <div className="operations-booking-summary"><div><strong>{booking.vesselName || booking.ferryName || "Vessel not recorded"}</strong><p>{booking.origin} → {booking.destination} · {booking.date} · {booking.time}</p></div><div><strong>{hasMotorcycle(booking) ? "With motorcycle" : "No motorcycle"} · {passengers.length} {passengers.length === 1 ? "passenger" : "passengers"}</strong><p>Maximum {hasMotorcycle(booking) ? 3 : 10} passengers</p></div><div><strong>{money(booking.totalPaid ?? booking.requiredAmount)}</strong><p>{paid ? "Payment confirmed" : `Payment ${booking.paymentStatus || "not confirmed"}`}</p></div></div>
        <section className="operations-passenger-list" aria-label="Booking passengers">{passengers.map((person, index) => {
            const request = (preview ? ops.requests : liveRequests).findLast(item => item.id === person.discountRequestId || item.passengerId === person.id || item.identity === passengerIdentity(person));
            const category = !person.category && !(Number(person.age) >= 60) ? "Category not recorded" : discountCategory(person);
            return <div className="operations-passenger-row" key={person.id}><div><strong>{person.name}</strong><p>{person.age !== undefined ? `Age ${person.age}` : "Age not recorded"} · {person.gender || "Gender not recorded"}{person.savedProfile ? " · Saved account profile" : ""}</p></div><div><strong>{category}</strong><p>{index === 0 && person.savedProfile ? "Saved from account registration" : "Individual passenger details"}</p></div><div><strong>{request ? request.status === "approved" ? "ID approved" : request.status === "requested" ? "New photo requested" : "Pending staff review" : "Not requested"}</strong><p>{request?.photo ? "ID photo submitted" : "No ID photo"}</p></div>{role === "staff" && <StaffButton variant="secondary" disabled={!preview || category === "Regular"} onClick={() => review(person)}>Review ID</StaffButton>}</div>;
        })}</section>
        <p>Passenger 1 uses their linked account profile when available. Companions need their own details and ID approval. One discount applies per eligible passenger; motorcycle charges and PPA fees are excluded.</p>
        {role === "staff" && issue && <StaffNotice error>{issue.detail}</StaffNotice>}<StaffNotice>{message}</StaffNotice><StaffNotice error>{error}</StaffNotice>
        <div className="operations-footer"><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/${role === "staff" ? "manifest" : "tickets"}`)}>Back to records</StaffButton><div className="staff-actions">{role === "admin" ? <><StaffButton variant="secondary" onClick={() => { onSelectRelatedTrip?.(booking); navigate(`${basePath}/payments?payment=${encodeURIComponent(booking._id)}`); }}>Payment records</StaffButton><StaffButton onClick={() => navigate(`${basePath}/pricing`)}>Vessel pricing</StaffButton></> : <><StaffButton variant="secondary" onClick={() => navigate(`${basePath}/discounts`)}>Discount approvals</StaffButton><StaffButton disabled={!!issue || busy} onClick={() => setConfirm(true)}>Record boarding</StaffButton></>}</div></div>
        {confirm && <StaffDialog title="Record boarding for this ticket?" onClose={() => !busy && setConfirm(false)}><p>{booking.passengerName} · {booking.bookingReference} · {passengers.length} passengers</p><StaffNotice>Confirm that these passengers are boarding {trip?.vesselName} on the selected departure.</StaffNotice><div className="staff-actions"><StaffButton variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Cancel</StaffButton><StaffButton disabled={busy || !!issue} onClick={board}>{busy ? "Recording…" : "Confirm boarding"}</StaffButton></div></StaffDialog>}
    </>;
}
