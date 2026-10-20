import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StaffButton, StaffNotice, StaffStatus } from "../../components/staff/StaffUI";
import { OperationsPanel, PencilField } from "../../components/operations/OperationsUI";
import { discountCategory, operationsStore } from "../../components/operations/operationsStore";
import { useOperations } from "../../components/operations/useOperations";

export default function StaffDiscounts({ role = "staff", preview, trip, onHeading, readOnly = false, api }) {
    const ops = useOperations(preview);
    const [liveRequests, setLiveRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(!preview);
    const [params, setParams] = useSearchParams();
    useEffect(() => {
        if (preview || !api) { setLoadingRequests(false); return; }
        let active = true;
        setLoadingRequests(true);
        api.get(role === "admin" || readOnly ? "/admin/discount-requests" : "/staff/discount-requests").then(({ data }) => {
            if (active) setLiveRequests((data.requests || []).map(item => {
                const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
                return { id: item._id, passenger, photo: item.photo, status: item.status, reason: item.reason || "", source: item.source || "", requestId: item._id };
            }));
        }).catch(error => {
            if (active) setError(error.response?.data?.message || error.message || "Unable to load ID review requests.");
        }).finally(() => { if (active) setLoadingRequests(false); });
        return () => { active = false; };
    }, [preview, api, readOnly, role]);
    const requests = preview ? ops.requests : liveRequests;
    const request = requests.find(item => item.id === params.get("request"));
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [loadingRequestPhoto, setLoadingRequestPhoto] = useState(false);
    const [requestPhoto, setRequestPhoto] = useState("");
    useEffect(() => {
        setRequestPhoto("");
        if (!request || preview || request.photo || !api) {
            setLoadingRequestPhoto(false);
            return undefined;
        }
        let active = true;
        let photoUrl = "";
        setLoadingRequestPhoto(true);
        api.get(`${role === "admin" ? "/admin" : "/staff"}/discount-requests/${request.id}/photo`, { responseType: "blob" })
            .then(({ data }) => {
                if (!active) return;
                photoUrl = URL.createObjectURL(data);
                setRequestPhoto(photoUrl);
            })
            .catch(err => { if (active) setError(err.response?.data?.message || err.message || "Unable to load this ID photo."); })
            .finally(() => { if (active) setLoadingRequestPhoto(false); });
        return () => { active = false; if (photoUrl) URL.revokeObjectURL(photoUrl); };
    }, [request?.id, api, role, preview]);
    const displayedPhoto = request?.photo || requestPhoto;
    useEffect(() => { setReason(""); setError(""); setConfirmed(false); }, [request?.id]);
    const result = request?.status === "approved" ? "Discount approved" : request?.status === "requested" ? "New ID photo requested" : "Review discount ID";
    useEffect(() => { onHeading?.({ title: request ? result : readOnly ? "ID-review records" : "Discount approvals", subtitle: request ? "Approve a valid matching ID or request another photo." : "Review passenger IDs before Student, PWD or Senior discounts apply." }); }, [request?.id, result, readOnly, onHeading]);
    const back = () => { setParams({}); setError(""); };
    const decide = async decision => {
        try {
            if (preview) operationsStore.decide(request.id, decision, reason);
            else {
                const { data } = await api.put(`${role === "admin" ? "/admin" : "/staff"}/discount-requests/${request.id}`, { decision, reason });
                const item = data.request;
                setLiveRequests(current => current.map(row => row.id === item._id ? { ...row, status: item.status, reason: item.reason || "" } : row));
            }
            setError("");
        } catch (err) { setError(err.response?.data?.message || err.message); }
    };
    if (!preview && !api) return <StaffNotice error>Unable to connect to ID review records.</StaffNotice>;
    if (params.get("request") && !request) return <><StaffNotice error>This ID request is no longer available. It may have been reset.</StaffNotice><StaffButton variant="secondary" onClick={back}>Back to requests</StaffButton></>;
    if (request?.status !== "pending" && request) return <>
        <StaffNotice error={request.status === "requested"}><strong>{request.passenger.name} · {request.status === "approved" ? "ID approved" : "New photo required"}</strong><p>{request.status === "approved" ? "Only this passenger’s eligible fare can receive a discount. Other passengers need their own approval. Payment still needs confirmation." : `${request.reason}. The discount remains unapplied until a new photo is approved.`}</p></StaffNotice>
        <div className="operations-footer"><StaffButton variant="secondary" onClick={back}>Back to requests</StaffButton></div>
    </>;
    if (request) return <>
        {readOnly && <StaffNotice>Admin can inspect this request. Staff records the ID decision.</StaffNotice>}
        <div className="operations-equal-grid">
            <OperationsPanel><h2>Passenger ID</h2><div><h3>{request.passenger.name}</h3><p>Age {request.passenger.age} · {request.passenger.gender} · {request.source}</p></div><p>Check that the name, photo, category and validity match this passenger.</p>
                {loadingRequestPhoto ? <div className="operations-inset staff-empty"><h3>Loading ID photo</h3><p>Fetching this passenger’s submitted document.</p></div> : displayedPhoto ? <img className="operations-id-photo" src={displayedPhoto} alt={`Submitted ID for ${request.passenger.name}`} /> : <StaffNotice error>No ID photo is available. Request a clear photo before approving this passenger.</StaffNotice>}
                {displayedPhoto && !readOnly && <label className="staff-payment-check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I checked this passenger’s matching, readable and valid ID.</label>}
            </OperationsPanel>
            <OperationsPanel><h2>Discount request</h2><div><h3>Discount eligibility</h3><p>{discountCategory(request.passenger)} · Individual passenger discount</p><StaffStatus warning>Pending {role === "admin" ? "admin" : "staff"} review</StaffStatus></div>
                <div className="operations-inset"><h3>Before approving</h3><ul><li>Passenger name matches the ID.</li><li>Photo and details are readable.</li><li>Age 60+ or a valid Student/PWD category.</li><li>The submitted ID is valid.</li></ul></div>
                <PencilField label="Reason for another photo" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain what the passenger needs to fix" maxLength={500} disabled={readOnly} /><small>The passenger receives this reason with the new photo request.</small>
                <div className="operations-reasons">{["Unclear photo", "Does not match", "Invalid ID"].map(value => <StaffButton key={value} variant="secondary" disabled={readOnly} onClick={() => setReason(value)}>{value}</StaffButton>)}</div>
            </OperationsPanel>
        </div><StaffNotice error>{error}</StaffNotice>
        <div className="operations-footer"><StaffButton variant="secondary" onClick={back}>Back to requests</StaffButton>{!readOnly && <div className="staff-actions"><StaffButton variant="secondary" disabled={!reason.trim()} onClick={() => decide("requested")}>Request new photo</StaffButton><StaffButton disabled={!displayedPhoto || loadingRequestPhoto || !confirmed} onClick={() => decide("approved")}>Approve discount</StaffButton></div>}</div>
    </>;
    const pending = requests.filter(item => item.status === "pending");
    const reviewed = requests.filter(item => item.status !== "pending");
    return <>
        <StaffNotice><strong>{trip ? `${trip.vesselName} · ${trip.route}` : "Passenger ID review"}</strong><p>Review IDs from registrations and bookings individually. Ages 60+, Student and PWD require approval; regular passengers under 60 need no ID.</p></StaffNotice>
        {error && <StaffNotice error>{error}</StaffNotice>}
        <OperationsPanel><h2>Passenger ID requests</h2>{loadingRequests ? <div className="operations-inset staff-empty"><h3>Loading ID requests</h3><p>Connecting to submitted passenger photos.</p></div> : pending.length ? pending.map(item => <RequestRow key={item.id} item={item} onOpen={() => setParams({ request: item.id })} />) : <div className="operations-inset staff-empty"><h3>No requests to review</h3><p>Submitted passenger ID photos will appear here.</p></div>}</OperationsPanel>
        {!!reviewed.length && <OperationsPanel><h2>Reviewed IDs</h2>{reviewed.map(item => <RequestRow key={item.id} item={item} onOpen={() => setParams({ request: item.id })} />)}</OperationsPanel>}
    </>;
}
function RequestRow({ item, onOpen }) { return <div className="operations-record-row">{item.photo && <img className="operations-id-thumb" src={item.photo} alt={`Submitted ID for ${item.passenger.name}`} />}<div><strong>{item.passenger.name}</strong><p>Age {item.passenger.age} · {discountCategory(item.passenger)} · {item.source}</p></div><StaffStatus warning={item.status !== "approved"}>{item.status === "approved" ? "Approved" : item.status === "requested" ? "New photo needed" : item.photo ? "Pending review" : "No ID photo"}</StaffStatus><StaffButton variant="secondary" onClick={onOpen}>{item.status === "pending" ? "Review ID" : "View decision"}</StaffButton></div>; }
